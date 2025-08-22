import { asc, eq, or } from 'astro:db';
import config from 'studiocms:config';
import {
	CMSNotificationSettingsId,
	CMSSiteConfigId,
	GhostUserDefaults,
	versionCacheLifetime,
} from '../../../consts.js';
import { Effect, genLogger } from '../../../effect.js';
import {
	FolderListMapID,
	FolderTreeMapID,
	PageFolderTreeMapID,
	SiteConfigMapID,
	StudioCMSPkgId,
	VersionMapID,
} from '../consts.js';
import {
	AstroDB,
	GetVersionFromNPM,
	SDKCore_Collectors,
	SDKCore_FolderTree,
	SDKCore_Users,
} from '../effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import {
	tsDiffTracking,
	tsEmailVerificationTokens,
	tsNotificationSettings,
	tsOAuthAccounts,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPageFolderStructure,
	tsPermissions,
	tsSessionTable,
	tsSiteConfig,
	tsUsers,
} from '../tables.js';
import type {
	CombinedPageData,
	CombinedUserData,
	FolderNode,
	MetaOnlyPageData,
	MetaOnlyPageDataCacheObject,
	PageDataCacheObject,
	PaginateInput,
} from '../types/index.js';
import {
	_ClearUnknownError,
	_clearLibSQLError,
	CacheContext,
	convertCombinedPageDataToMetaOnly,
	filterPagesByDraftAndIndex,
	folderListReturn,
	folderTreeReturn,
	isCacheEnabled,
	isCacheExpired,
	pageDataReturn,
	siteConfigReturn,
	versionReturn,
} from '../utils.js';

/**
 * The `SDKCore_GET` service provides a comprehensive set of data retrieval methods for the StudioCMS SDK.
 * It encapsulates database queries, caching logic, and transformation utilities for core CMS entities such as pages, users, folders, permissions, and site configuration.
 *
 * @remarks
 * - All methods are wrapped in `Effect` for composable error handling and dependency injection.
 * - Caching is used for performance optimization, with cache invalidation and fallback to database queries.
 * - Pagination, filtering, and meta-only retrieval are supported for page queries.
 *
 * @example
 * ```typescript
 * const pages = yield* GET.pages();
 * const user = yield* GET.users.byId("user-id");
 * const folderTree = yield* GET.folderTree();
 * ```
 *
 * @service studiocms/sdk/SDKCore/modules/get
 * @dependencies
 * - AstroDB.Default
 * - SDKCore_FolderTree.Default
 * - GetVersionFromNPM.Default
 * - SDKCore_Users.Default
 * - SDKCore_Collectors.Default
 *
 * @effect
 * Provides the following main query groups:
 * - `databaseTable`: Direct access to raw database tables.
 * - `permissionsLists`: Retrieve users by permission rank.
 * - `users`: Retrieve user data by various identifiers.
 * - `folder`, `folderTree`, `folderList`, `pageFolderTree`: Folder and tree structure queries.
 * - `siteConfig`, `latestVersion`: Site configuration and version info.
 * - `page`: Retrieve page data by ID or slug.
 * - `folderPages`, `packagePages`, `pages`: Retrieve pages by folder, package, or all pages.
 *
 * @throws {SDKCoreError} If a database or unknown error occurs during retrieval.
 */
export class SDKCore_GET extends Effect.Service<SDKCore_GET>()(
	'studiocms/sdk/SDKCore/modules/get',
	{
		dependencies: [
			AstroDB.Default,
			SDKCore_FolderTree.Default,
			GetVersionFromNPM.Default,
			SDKCore_Users.Default,
			SDKCore_Collectors.Default,
		],
		effect: genLogger('studiocms/sdk/SDKCore/modules/get/effect')(function* () {
			const [
				dbService,
				{ FolderList, pages, folderTree, version, siteConfig, pageFolderTree },
				{ buildFolderTree, getAvailableFolders, addPageToFolderTree },
				getVersionFromNPM,
				{ combineRanks, verifyRank },
				{ collectUserData, collectPageData },
			] = yield* Effect.all([
				AstroDB,
				CacheContext,
				SDKCore_FolderTree,
				GetVersionFromNPM,
				SDKCore_Users,
				SDKCore_Collectors,
			]);

			/**
			 * Validates the pagination input by ensuring that `limit` and `offset` are non-negative values.
			 * If `limit` is zero, it sets a default value of 10.
			 * Returns the validated (and possibly modified) pagination input.
			 * If validation fails, yields an `SDKCoreError` with a descriptive message.
			 *
			 * @template P - Type extending `PaginateInput`.
			 * @param paginate - The pagination input to validate.
			 * @returns The validated pagination input or fails with an error if validation fails.
			 */
			const validatePagination = Effect.fn(function* <P extends PaginateInput>(paginate: P) {
				if (paginate.limit < 0 || paginate.offset < 0) {
					return yield* Effect.fail(
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(
								'Pagination limit and offset must be non-negative values'
							),
						})
					);
				}
				if (paginate.limit === 0) {
					paginate.limit = 10; // Default value
				}
				return paginate;
			});

			/**
			 * Retrieves a folder from the database by its ID or name.
			 *
			 * This function queries the `tsPageFolderStructure` table for a folder whose `id` or `name`
			 * matches the provided `idOrName` parameter. If no matching folder is found, it fails with a
			 * `LibSQLDatabaseError`.
			 *
			 * @param idOrName - The ID or name of the folder to retrieve.
			 * @returns The folder data if found.
			 * @throws {SDKCoreError} If the folder is not found in the database.
			 */
			const getFolderByNameOrId = Effect.fn(function* (idOrName: string) {
				const data = yield* dbService.execute((db) =>
					db
						.select()
						.from(tsPageFolderStructure)
						.where(
							or(eq(tsPageFolderStructure.id, idOrName), eq(tsPageFolderStructure.name, idOrName))
						)
						.get()
				);
				if (!data) {
					return yield* Effect.fail(
						new SDKCoreError({
							type: 'LibSQLDatabaseError',
							cause: new StudioCMS_SDK_Error(`Folder not found in Database: ${idOrName}`),
						})
					);
				}
				return data;
			});

			function _getPackagesPages(
				packageName: string,
				tree?: FolderNode[]
			): Effect.Effect<CombinedPageData[], SDKCoreError, never>;
			function _getPackagesPages(
				packageName: string,
				tree?: FolderNode[],
				metaOnly?: boolean
			): Effect.Effect<MetaOnlyPageData[], SDKCoreError, never>;

			/**
			 * Retrieves all pages associated with a given package name, optionally using a provided folder tree and returning only metadata if specified.
			 *
			 * @param packageName - The name of the package to fetch pages for.
			 * @param tree - Optional. A pre-built folder tree to use for organizing pages. If not provided, the folder tree will be built automatically.
			 * @param metaOnly - Optional. If true, returns only metadata for each page; otherwise, returns combined page data. Defaults to false.
			 * @returns An Effect that resolves to an array of page data, either as `MetaOnlyPageData[]` or `CombinedPageData[]` depending on `metaOnly`.
			 */
			function _getPackagesPages(packageName: string, tree?: FolderNode[], metaOnly = false) {
				return Effect.gen(function* () {
					const pagesRaw = yield* dbService.execute((db) =>
						db.select().from(tsPageData).where(eq(tsPageData.package, packageName))
					);

					const folders = tree || (yield* buildFolderTree);

					const pages = [];

					for (const page of pagesRaw) {
						const data = yield* collectPageData(page, folders, metaOnly);
						pages.push(data);
					}
					if (metaOnly) {
						return pages as MetaOnlyPageData[];
					}
					return pages as CombinedPageData[];
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('GET.packagePages', cause),
					})
				);
			}

			function _getPageById(id: string): Effect.Effect<PageDataCacheObject, SDKCoreError, never>;
			function _getPageById(
				id: string,
				metaOnly?: boolean
			): Effect.Effect<MetaOnlyPageDataCacheObject, SDKCoreError, never>;

			/**
			 * Retrieves a page by its ID, with an option to return only metadata.
			 *
			 * @param id - The ID of the page to retrieve.
			 * @param metaOnly - If `true`, returns only metadata for the page. Defaults to `false`.
			 * @returns An `Effect` that yields the page data or metadata, depending on `metaOnly`.
			 *
			 * @throws UnknownException - If an unknown error occurs during retrieval.
			 * @throws LibSQLDatabaseError - If a database error occurs during retrieval.
			 */
			function _getPageById(id: string, metaOnly = false) {
				const getPage = (id: string, tree?: FolderNode[]) =>
					Effect.gen(function* () {
						const page = yield* dbService.execute((db) =>
							db.select().from(tsPageData).where(eq(tsPageData.id, id)).get()
						);

						if (!page) return undefined;

						const folders = tree || (yield* buildFolderTree);

						return yield* collectPageData(page, folders);
					});

				const handlePageNotFound = () =>
					Effect.fail(
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error('Page not found in Database'),
						})
					);

				return Effect.gen(function* () {
					const status = yield* isCacheEnabled;

					if (!status) {
						const page = yield* getPage(id);

						if (!page) {
							return yield* handlePageNotFound();
						}

						const pageData = pageDataReturn(page);

						return metaOnly ? convertCombinedPageDataToMetaOnly(pageData) : pageData;
					}

					const { data: tree } = yield* GET.folderTree();

					const cachedPage = pages.get(id);

					if (!cachedPage || isCacheExpired(cachedPage)) {
						const page = yield* getPage(id, tree);

						if (!page) {
							return yield* handlePageNotFound();
						}

						const returnPage = pageDataReturn(page);

						pages.set(id, returnPage);

						return metaOnly ? convertCombinedPageDataToMetaOnly(returnPage) : returnPage;
					}

					// Return the cached page
					return metaOnly ? convertCombinedPageDataToMetaOnly(cachedPage) : cachedPage;
				}).pipe(
					Effect.catchTags({
						UnknownException: (cause: unknown) => _clearLibSQLError('GET.page.byId', cause),
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('GET.page.byId', cause),
					})
				);
			}

			function _getPageBySlug(
				slug: string
			): Effect.Effect<PageDataCacheObject, SDKCoreError, never>;
			function _getPageBySlug(
				slug: string,
				metaOnly?: boolean
			): Effect.Effect<MetaOnlyPageDataCacheObject, SDKCoreError, never>;

			/**
			 * Retrieves a page by its slug, with an option to return only metadata.
			 *
			 * @param slug - The slug of the page to retrieve.
			 * @param metaOnly - If `true`, returns only metadata for the page. Defaults to `false`.
			 * @returns An `Effect` that yields the page data or metadata, depending on `metaOnly`.
			 *
			 * @throws UnknownException - If an unknown error occurs during retrieval.
			 * @throws LibSQLDatabaseError - If a database error occurs during retrieval.
			 */
			function _getPageBySlug(slug: string, metaOnly = false) {
				const getPage = (iSlug: string, tree?: FolderNode[]) =>
					Effect.gen(function* () {
						const page = yield* dbService.execute((db) =>
							db.select().from(tsPageData).where(eq(tsPageData.slug, iSlug)).get()
						);

						if (!page) return undefined;

						const folders = tree || (yield* buildFolderTree);

						return yield* collectPageData(page, folders);
					});

				return Effect.gen(function* () {
					const status = yield* isCacheEnabled;

					if (!status) {
						const page = yield* getPage(slug);

						if (!page) {
							return yield* Effect.fail(
								new SDKCoreError({
									type: 'UNKNOWN',
									cause: new StudioCMS_SDK_Error('Page not found in Database'),
								})
							);
						}

						const pageData = pageDataReturn(page);

						return metaOnly ? convertCombinedPageDataToMetaOnly(pageData) : pageData;
					}

					const { data: tree } = yield* GET.folderTree();

					// Retrieve the cached page
					const cachedPage = Array.from(pages.values()).find((page) => page.data.slug === slug);

					if (!cachedPage || isCacheExpired(cachedPage)) {
						const page = yield* getPage(slug, tree);

						if (!page) {
							return yield* Effect.fail(
								new SDKCoreError({
									type: 'UNKNOWN',
									cause: new StudioCMS_SDK_Error('Page not found in Database'),
								})
							);
						}

						const pageData = pageDataReturn(page);
						pages.set(page.id, pageData);

						return metaOnly ? convertCombinedPageDataToMetaOnly(pageData) : pageData;
					}

					// Return the cached page
					return metaOnly ? convertCombinedPageDataToMetaOnly(cachedPage) : cachedPage;
				}).pipe(
					Effect.catchTags({
						UnknownException: (cause) => _clearLibSQLError('GET.page.bySlug', cause),
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('GET.page.bySlug', cause),
					})
				);
			}

			function _getAllPages(
				includeDrafts?: boolean,
				hideDefaultIndex?: boolean,
				metaOnly?: false,
				paginate?: PaginateInput
			): Effect.Effect<PageDataCacheObject[], SDKCoreError, never>;
			function _getAllPages(
				includeDrafts?: boolean,
				hideDefaultIndex?: boolean,
				metaOnly?: true,
				paginate?: PaginateInput
			): Effect.Effect<MetaOnlyPageDataCacheObject[], SDKCoreError, never>;

			/**
			 * Retrieves all pages from the database or cache, with options for including drafts,
			 * hiding the default index page, returning only metadata, and paginating results.
			 *
			 * - If caching is enabled, attempts to return cached pages and updates expired cache entries.
			 * - If caching is disabled, fetches pages directly from the database.
			 * - Supports filtering by draft status and default index visibility.
			 * - Can return either full page data or metadata only.
			 * - Supports pagination via the `paginate` parameter.
			 *
			 * @param includeDrafts - Whether to include draft pages in the results. Defaults to `false`.
			 * @param hideDefaultIndex - Whether to exclude the default index page from the results. Defaults to `false`.
			 * @param metaOnly - Whether to return only metadata for each page. Defaults to `false`.
			 * @param paginate - Optional pagination input specifying `limit` and `offset`.
			 * @returns An `Effect` that yields an array of page data or metadata, depending on `metaOnly`.
			 */
			function _getAllPages(
				includeDrafts = false,
				hideDefaultIndex = false,
				metaOnly = false,
				paginate?: PaginateInput
			) {
				const getPages = (
					includeDrafts = false,
					hideDefaultIndex = false,
					tree?: FolderNode[],
					paginate?: PaginateInput
				) =>
					Effect.gen(function* () {
						let pagesRaw: (typeof tsPageData.$inferSelect)[] = [];

						if (paginate) {
							const paginateData = yield* validatePagination(paginate);
							pagesRaw = yield* dbService.execute((db) =>
								db
									.select()
									.from(tsPageData)
									.orderBy(asc(tsPageData.title))
									.limit(paginateData.limit)
									.offset(paginateData.offset)
							);
						} else {
							pagesRaw = yield* dbService.execute((db) =>
								db.select().from(tsPageData).orderBy(asc(tsPageData.title))
							);
						}

						const pagesFiltered = filterPagesByDraftAndIndex(
							pagesRaw,
							includeDrafts,
							hideDefaultIndex
						);

						const folders = tree || (yield* buildFolderTree);

						const pages = [];

						for (const page of pagesFiltered) {
							const data = yield* collectPageData(page, folders);
							pages.push(data);
						}

						return pages;
					});
				return Effect.gen(function* () {
					const status = yield* isCacheEnabled;

					if (!status) {
						const dbPages = yield* getPages(includeDrafts, hideDefaultIndex, undefined, paginate);

						const data = dbPages.map((page) => pageDataReturn(page));
						return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
					}

					const { data: tree } = yield* GET.folderTree();

					if (pages.size === 0) {
						const newData = yield* getPages(includeDrafts, hideDefaultIndex, tree);

						// Loop through the updated data and store it in the cache
						for (const data of newData) {
							pages.set(data.id, pageDataReturn(data));
						}

						const data = newData.map((data) => pageDataReturn(data));

						if (paginate) {
							const sortedData = data.sort((a, b) => a.data.title.localeCompare(b.data.title));
							const paginatedData = sortedData.slice(
								paginate.offset,
								paginate.offset + paginate.limit
							);
							return metaOnly ? convertCombinedPageDataToMetaOnly(paginatedData) : paginatedData;
						}

						// Transform and return the data
						return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
					}

					const cacheMap = Array.from(pages.values());

					for (const item of cacheMap) {
						if (isCacheExpired(item)) {
							const { data: updatedData } = yield* GET.page.byId(item.data.id);

							pages.set(updatedData.id, pageDataReturn(updatedData));
						}
					}

					const data = Array.from(pages.values());

					if (paginate) {
						const sortedData = data.sort((a, b) => a.data.title.localeCompare(b.data.title));
						const paginatedData = sortedData.slice(
							paginate.offset,
							paginate.offset + paginate.limit
						);
						return metaOnly ? convertCombinedPageDataToMetaOnly(paginatedData) : paginatedData;
					}

					return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
				}).pipe(
					Effect.catchTags({
						UnknownException: (cause) => _clearLibSQLError('GET.pages', cause),
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('GET.pages', cause),
					})
				);
			}

			function _folderPages(
				idOrName: string,
				includeDrafts?: boolean,
				hideDefaultIndex?: boolean,
				metaOnly?: false,
				paginate?: PaginateInput
			): Effect.Effect<PageDataCacheObject[], SDKCoreError, never>;
			function _folderPages(
				idOrName: string,
				includeDrafts?: boolean,
				hideDefaultIndex?: boolean,
				metaOnly?: true,
				paginate?: PaginateInput
			): Effect.Effect<MetaOnlyPageDataCacheObject[], SDKCoreError, never>;

			/**
			 * Retrieves pages within a specified folder by its ID or name, supporting various filtering and pagination options.
			 *
			 * This function handles both cached and non-cached scenarios, fetching pages from the database or cache as appropriate.
			 * It supports filtering drafts, hiding default index pages, returning only metadata, and paginating results.
			 *
			 * @param idOrName - The ID or name of the folder to retrieve pages from.
			 * @param includeDrafts - Whether to include draft pages in the results. Defaults to `false`.
			 * @param hideDefaultIndex - Whether to exclude default index pages from the results. Defaults to `false`.
			 * @param metaOnly - If `true`, returns only metadata for each page. Defaults to `false`.
			 * @param paginate - Optional pagination input specifying `limit` and `offset`.
			 * @returns An `Effect` that yields an array of page data or metadata, depending on `metaOnly`.
			 *
			 * @throws UnknownException - If an unknown error occurs during retrieval.
			 * @throws LibSQLDatabaseError - If a database error occurs during retrieval.
			 */
			function _folderPages(
				idOrName: string,
				includeDrafts = false,
				hideDefaultIndex = false,
				metaOnly = false,
				paginate?: PaginateInput
			) {
				const getAllPages = (
					includeDrafts = false,
					hideDefaultIndex = false,
					tree?: FolderNode[],
					paginate?: PaginateInput
				) =>
					Effect.gen(function* () {
						let pagesRaw: (typeof tsPageData.$inferSelect)[] = [];

						if (paginate) {
							const paginateData = yield* validatePagination(paginate);
							pagesRaw = yield* dbService.execute((db) =>
								db
									.select()
									.from(tsPageData)
									.orderBy(asc(tsPageData.title))
									.limit(paginateData.limit)
									.offset(paginateData.offset)
							);
						} else {
							pagesRaw = yield* dbService.execute((db) =>
								db.select().from(tsPageData).orderBy(asc(tsPageData.title))
							);
						}

						const pagesFiltered = filterPagesByDraftAndIndex(
							pagesRaw,
							includeDrafts,
							hideDefaultIndex
						);

						const folders = tree || (yield* buildFolderTree);

						const pages = [];

						for (const page of pagesFiltered) {
							const data = yield* collectPageData(page, folders);
							pages.push(data);
						}

						return pages;
					});
				const getPages = (
					id: string,
					includeDrafts = false,
					hideDefaultIndex = false,
					tree?: FolderNode[]
				) =>
					Effect.gen(function* () {
						const pagesRaw = yield* dbService.execute((db) =>
							db
								.select()
								.from(tsPageData)
								.where(eq(tsPageData.parentFolder, id))
								.orderBy(asc(tsPageData.title))
						);

						const pagesFiltered = filterPagesByDraftAndIndex(
							pagesRaw,
							includeDrafts,
							hideDefaultIndex
						);

						const folders = tree || (yield* buildFolderTree);

						const pages = [];

						for (const page of pagesFiltered) {
							pages.push(yield* collectPageData(page, folders));
						}

						return pages;
					});

				return Effect.gen(function* () {
					const status = yield* isCacheEnabled;

					const folderData = yield* getFolderByNameOrId(idOrName);

					if (!status) {
						const dbPages = yield* getPages(folderData.id, includeDrafts, hideDefaultIndex);
						const data = dbPages.map((page) => pageDataReturn(page));
						return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
					}

					const { data: tree } = yield* GET.folderTree();

					if (pages.size === 0) {
						const updatedData = yield* getAllPages(includeDrafts, hideDefaultIndex, tree);

						for (const data of updatedData) {
							pages.set(data.id, pageDataReturn(data));
						}

						const data = updatedData
							.filter(({ parentFolder }) => parentFolder === folderData.id)
							.map((data) => pageDataReturn(data));

						if (paginate) {
							const sortedData = data.sort((a, b) => a.data.title.localeCompare(b.data.title));
							const paginatedData = sortedData.slice(
								paginate.offset,
								paginate.offset + paginate.limit
							);
							return metaOnly ? convertCombinedPageDataToMetaOnly(paginatedData) : paginatedData;
						}

						// Transform and return the data
						return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
					}

					const cacheMap = Array.from(pages.values());

					for (const item of cacheMap) {
						if (isCacheExpired(item)) {
							const { data: updatedData } = yield* GET.page.byId(item.data.id);

							pages.set(updatedData.id, pageDataReturn(updatedData));
						}
					}

					const data = Array.from(pages.values()).filter(
						({ data: { parentFolder } }) => parentFolder === folderData.id
					);

					if (paginate) {
						const sortedData = data.sort((a, b) => a.data.title.localeCompare(b.data.title));
						const paginatedData = sortedData.slice(
							paginate.offset,
							paginate.offset + paginate.limit
						);
						return metaOnly ? convertCombinedPageDataToMetaOnly(paginatedData) : paginatedData;
					}
					return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
				}).pipe(
					Effect.catchTags({
						UnknownException: (cause) => _clearLibSQLError('GET.pages', cause),
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('GET.pages', cause),
					})
				);
			}

			/**
			 * Retrieves the list of permissions for users with the specified rank.
			 *
			 * This function queries the database for all permitted users and existing users,
			 * then verifies and returns the permissions associated with the given rank.
			 * Handles database errors by invoking a custom error handler.
			 *
			 * @param rank - The rank of users to retrieve permissions for. Must be one of 'owner', 'admin', 'editor', or 'visitor'.
			 * @returns An Effect that resolves to the verified permissions for the specified rank, or handles database errors.
			 */
			const getPermissionsByRank = (rank: 'owner' | 'admin' | 'editor' | 'visitor') =>
				Effect.gen(function* () {
					const currentPermittedUsers = yield* dbService.execute((db) =>
						db.select().from(tsPermissions)
					);
					const existingUsers = yield* dbService.execute((db) => db.select().from(tsUsers));

					return yield* verifyRank(existingUsers, currentPermittedUsers, rank);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError(`GET.permissionsLists.${rank}s`, cause),
					})
				);

			const GET = {
				databaseTable: {
					users: () => dbService.execute((db) => db.select().from(tsUsers)),
					oAuthAccounts: () => dbService.execute((db) => db.select().from(tsOAuthAccounts)),
					sessionTable: () => dbService.execute((db) => db.select().from(tsSessionTable)),
					permissions: () => dbService.execute((db) => db.select().from(tsPermissions)),
					pageData: () => dbService.execute((db) => db.select().from(tsPageData)),
					pageDataTags: () => dbService.execute((db) => db.select().from(tsPageDataTags)),
					pageDataCategories: () =>
						dbService.execute((db) => db.select().from(tsPageDataCategories)),
					pageContent: () => dbService.execute((db) => db.select().from(tsPageContent)),
					siteConfig: () =>
						dbService.execute((db) =>
							db.select().from(tsSiteConfig).where(eq(tsSiteConfig.id, CMSSiteConfigId)).get()
						),
					diffTracking: () => dbService.execute((db) => db.select().from(tsDiffTracking)),
					pageFolderStructure: () =>
						dbService.execute((db) => db.select().from(tsPageFolderStructure)),
					notificationSettings: () =>
						dbService.execute((db) =>
							db
								.select()
								.from(tsNotificationSettings)
								.where(eq(tsNotificationSettings.id, CMSNotificationSettingsId))
								.get()
						),
					emailVerificationTokens: () =>
						dbService.execute((db) => db.select().from(tsEmailVerificationTokens)),
				},
				permissionsLists: {
					/**
					 * Retrieves all permissions for users in the database.
					 *
					 * @returns A promise that resolves to an array of combined rank data.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the permissions.
					 */
					all: () =>
						Effect.gen(function* () {
							const currentPermittedUsers = yield* dbService.execute((db) =>
								db.select().from(tsPermissions)
							);
							const existingUsers = yield* dbService.execute((db) => db.select().from(tsUsers));

							const owners = yield* verifyRank(existingUsers, currentPermittedUsers, 'owner');

							const admins = yield* verifyRank(existingUsers, currentPermittedUsers, 'admin');

							const editors = yield* verifyRank(existingUsers, currentPermittedUsers, 'editor');

							const visitors = yield* verifyRank(existingUsers, currentPermittedUsers, 'visitor');

							return [
								...(yield* combineRanks('owner', owners)),
								...(yield* combineRanks('admin', admins)),
								...(yield* combineRanks('editor', editors)),
								...(yield* combineRanks('visitor', visitors)),
							];
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('GET.permissionsLists.all', cause),
							})
						),
					/**
					 * Retrieves all owners in the database.
					 *
					 * @returns A promise that resolves to an array of combined rank data.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the owners.
					 */
					owners: () => getPermissionsByRank('owner'),
					/**
					 * Retrieves all admins in the database.
					 *
					 * @returns A promise that resolves to an array of combined rank data.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the admins.
					 */
					admins: () => getPermissionsByRank('admin'),
					/**
					 * Retrieves all editors in the database.
					 *
					 * @returns A promise that resolves to an array of combined rank data.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the editors.
					 */
					editors: () => getPermissionsByRank('editor'),
					/**
					 * Retrieves all visitors in the database.
					 *
					 * @returns A promise that resolves to an array of combined rank data.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the visitors.
					 */
					visitors: () => getPermissionsByRank('visitor'),
				},
				users: {
					/**
					 * Retrieves all users from the database.
					 *
					 * @returns A promise that resolves to an array of combined user data.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the users.
					 */
					all: () =>
						Effect.gen(function* () {
							const combinedUserData: CombinedUserData[] = [];

							const users = yield* dbService.execute((db) => db.select().from(tsUsers));

							for (const user of users) {
								if (user.id === GhostUserDefaults.id) {
									continue;
								}

								const UserData = yield* collectUserData(user);

								combinedUserData.push(UserData);
							}

							return combinedUserData;
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('GET.users.all', cause),
							})
						),
					/**
					 * Retrieves a user by ID.
					 *
					 * @param id - The ID of the user to retrieve.
					 * @returns A promise that resolves to the user data.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the user.
					 */
					byId: (id: string) =>
						Effect.gen(function* () {
							const user = yield* dbService.execute((db) =>
								db.select().from(tsUsers).where(eq(tsUsers.id, id)).get()
							);

							if (!user) return undefined;
							return yield* collectUserData(user);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('GET.users.byId', cause),
							})
						),
					/**
					 * Retrieves a user by username.
					 *
					 * @param username - The username of the user to retrieve.
					 * @returns A promise that resolves to the user data.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the user.
					 */
					byUsername: (username: string) =>
						Effect.gen(function* () {
							const user = yield* dbService.execute((db) =>
								db.select().from(tsUsers).where(eq(tsUsers.username, username)).get()
							);

							if (!user) return undefined;
							return yield* collectUserData(user);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('GET.users.byId', cause),
							})
						),
					/**
					 * Retrieves a user by email.
					 *
					 * @param email - The email of the user to retrieve.
					 * @returns A promise that resolves to the user data.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the user.
					 */
					byEmail: (email: string) =>
						Effect.gen(function* () {
							const user = yield* dbService.execute((db) =>
								db.select().from(tsUsers).where(eq(tsUsers.email, email)).get()
							);

							if (!user) return undefined;
							return yield* collectUserData(user);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('GET.users.byId', cause),
							})
						),
				},

				/**
				 * Retrieves a folder by ID.
				 *
				 * @param id - The ID of the folder to retrieve.
				 * @returns A promise that resolves to the folder data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the folder.
				 */
				folder: dbService.makeQuery((ex, id: string) =>
					ex((db) =>
						db.select().from(tsPageFolderStructure).where(eq(tsPageFolderStructure.id, id)).get()
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('GET.folder', cause),
						})
					)
				),

				/**
				 * Retrieves the site configuration, with caching support.
				 * If caching is enabled, it checks the cache for an existing site config.
				 * If the cache is expired or not available, it fetches the site config from the database
				 * and updates the cache.
				 * @returns An `Effect` that yields the site config.
				 * @throws UnknownException - If an unknown error occurs during retrieval.
				 * @throws LibSQLDatabaseError - If a database error occurs during retrieval.
				 */
				siteConfig: () =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;

						if (config.dbStartPage) {
							return undefined;
						}

						if (!status) {
							const newConfig = yield* dbService.execute((db) =>
								db.select().from(tsSiteConfig).where(eq(tsSiteConfig.id, CMSSiteConfigId)).get()
							);

							if (!newConfig) {
								return yield* Effect.fail(
									new SDKCoreError({
										type: 'UNKNOWN',
										cause: new StudioCMS_SDK_Error('Site config not found in database'),
									})
								);
							}

							return siteConfigReturn(newConfig);
						}

						const currentSiteConfig = siteConfig.get(SiteConfigMapID);

						if (!currentSiteConfig || isCacheExpired(currentSiteConfig)) {
							const newConfig = yield* dbService.execute((db) =>
								db.select().from(tsSiteConfig).where(eq(tsSiteConfig.id, CMSSiteConfigId)).get()
							);

							if (!newConfig) {
								return yield* Effect.fail(
									new SDKCoreError({
										type: 'UNKNOWN',
										cause: new StudioCMS_SDK_Error('Site config not found in database'),
									})
								);
							}

							const returnConfig = siteConfigReturn(newConfig);

							siteConfig.set(SiteConfigMapID, returnConfig);

							return returnConfig;
						}

						return currentSiteConfig;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _clearLibSQLError('GET.siteConfig', cause),
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('GET.siteConfig', cause),
						})
					),

				/**
				 * Retrieves the folder tree structure, with caching support.
				 * If caching is enabled, it checks the cache for an existing folder tree.
				 * If the cache is expired or not available, it fetches the folder tree from the database
				 * and updates the cache.
				 * @returns An `Effect` that yields the folder tree.
				 * @throws UnknownException - If an unknown error occurs during retrieval.
				 * @throws LibSQLDatabaseError - If a database error occurs during retrieval.
				 */
				folderTree: () =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;

						if (!status) {
							return folderTreeReturn(yield* buildFolderTree);
						}

						const tree = folderTree.get(FolderTreeMapID);

						if (!tree || isCacheExpired(tree)) {
							const newFolderTree = yield* buildFolderTree;

							const returnable = folderTreeReturn(newFolderTree);

							folderTree.set(FolderTreeMapID, returnable);

							return returnable;
						}

						return tree;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _clearLibSQLError('GET.folderTree', cause),
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('GET.folderTree', cause),
						})
					),

				/**
				 * Retrieves the folder tree structure, with caching support.
				 * If caching is enabled, it checks the cache for an existing folder tree.
				 * If the cache is expired or not available, it fetches the folder tree from the database
				 * and updates the cache.
				 * @returns An `Effect` that yields the folder tree.
				 * @throws UnknownException - If an unknown error occurs during retrieval.
				 * @throws LibSQLDatabaseError - If a database error occurs during retrieval.
				 */
				pageFolderTree: (hideDefaultIndex = false) =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;

						if (!status) {
							const folderTree = yield* buildFolderTree;
							const pages = yield* GET.pages(true, hideDefaultIndex);

							for (const { data: page } of pages) {
								if (page.parentFolder) {
									yield* addPageToFolderTree(folderTree, page.parentFolder, {
										id: page.id,
										name: page.title,
										page: true,
										pageData: page,
										children: [],
									});
								} else {
									folderTree.push({
										id: page.id,
										name: page.title,
										page: true,
										pageData: page,
										children: [],
									});
								}
							}

							return folderTreeReturn(folderTree);
						}

						const tree = pageFolderTree.get(PageFolderTreeMapID);

						if (!tree || isCacheExpired(tree)) {
							const newFolderTree = yield* buildFolderTree;
							const pages = yield* GET.pages(true, hideDefaultIndex);

							for (const { data: page } of pages) {
								if (page.parentFolder) {
									yield* addPageToFolderTree(newFolderTree, page.parentFolder, {
										id: page.id,
										name: page.title,
										page: true,
										pageData: page,
										children: [],
									});
								} else {
									newFolderTree.push({
										id: page.id,
										name: page.title,
										page: true,
										pageData: page,
										children: [],
									});
								}
							}

							pageFolderTree.set(PageFolderTreeMapID, folderTreeReturn(newFolderTree));

							return folderTreeReturn(newFolderTree);
						}

						return tree;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _clearLibSQLError('GET.pageFolderTree', cause),
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('GET.pageFolderTree', cause),
						})
					),

				/**
				 * Retrieves a list of available folders, with caching support.
				 * If caching is enabled, it checks the cache for an existing folder list.
				 * If the cache is expired or not available, it fetches the folder list from the database
				 * and updates the cache.
				 * @returns An `Effect` that yields the folder list.
				 * @throws UnknownException - If an unknown error occurs during retrieval.
				 * @throws LibSQLDatabaseError - If a database error occurs during retrieval.
				 */
				folderList: () =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;

						if (!status) {
							const folderList = yield* getAvailableFolders;

							return folderListReturn(folderList);
						}

						const list = FolderList.get(FolderListMapID);

						if (!list || isCacheExpired(list)) {
							const folderList = yield* getAvailableFolders;

							FolderList.set(FolderListMapID, folderListReturn(folderList));

							return folderListReturn(folderList);
						}

						return list;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _clearLibSQLError('GET.folderList', cause),
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('GET.folderList', cause),
						})
					),
				/**
				 * Retrieves the latest version of StudioCMS from NPM, with caching support.
				 * @returns An `Effect` that yields the latest version of StudioCMS.
				 * @throws UnknownException - If an unknown error occurs during retrieval.
				 */
				latestVersion: () =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;

						if (!status) {
							const version = yield* getVersionFromNPM.get(StudioCMSPkgId);
							return versionReturn(version);
						}

						const latestVersion = version.get(VersionMapID);

						if (!latestVersion || isCacheExpired(latestVersion, versionCacheLifetime)) {
							const newVersion = yield* getVersionFromNPM.get(StudioCMSPkgId);

							const latestVersion = versionReturn(newVersion);

							version.set(VersionMapID, latestVersion);

							return latestVersion;
						}

						return latestVersion;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _ClearUnknownError('GET.latestVersion', cause),
						})
					),
				page: {
					/**
					 * Retrieves a page by its ID, with an option to return only metadata.
					 *
					 * @param id - The ID of the page to retrieve.
					 * @param metaOnly - If `true`, returns only metadata for the page. Defaults to `false`.
					 * @returns An `Effect` that yields the page data or metadata, depending on `metaOnly`.
					 *
					 * @throws UnknownException - If an unknown error occurs during retrieval.
					 * @throws LibSQLDatabaseError - If a database error occurs during retrieval.
					 */
					byId: _getPageById,
					/**
					 * Retrieves a page by its slug, with an option to return only metadata.
					 *
					 * @param slug - The slug of the page to retrieve.
					 * @param metaOnly - If `true`, returns only metadata for the page. Defaults to `false`.
					 * @returns An `Effect` that yields the page data or metadata, depending on `metaOnly`.
					 *
					 * @throws UnknownException - If an unknown error occurs during retrieval.
					 * @throws LibSQLDatabaseError - If a database error occurs during retrieval.
					 */
					bySlug: _getPageBySlug,
				},
				/**
				 * Retrieves pages within a specified folder by its ID or name, supporting various filtering and pagination options.
				 *
				 * This function handles both cached and non-cached scenarios, fetching pages from the database or cache as appropriate.
				 * It supports filtering drafts, hiding default index pages, returning only metadata, and paginating results.
				 *
				 * @param idOrName - The ID or name of the folder to retrieve pages from.
				 * @param includeDrafts - Whether to include draft pages in the results. Defaults to `false`.
				 * @param hideDefaultIndex - Whether to exclude default index pages from the results. Defaults to `false`.
				 * @param metaOnly - If `true`, returns only metadata for each page. Defaults to `false`.
				 * @param paginate - Optional pagination input specifying `limit` and `offset`.
				 * @returns An `Effect` that yields an array of page data or metadata, depending on `metaOnly`.
				 *
				 * @throws UnknownException - If an unknown error occurs during retrieval.
				 * @throws LibSQLDatabaseError - If a database error occurs during retrieval.
				 */
				folderPages: _folderPages,
				/**
				 * Retrieves all pages associated with a given package name, optionally using a provided folder tree and returning only metadata if specified.
				 *
				 * @param packageName - The name of the package to fetch pages for.
				 * @param tree - Optional. A pre-built folder tree to use for organizing pages. If not provided, the folder tree will be built automatically.
				 * @param metaOnly - Optional. If true, returns only metadata for each page; otherwise, returns combined page data. Defaults to false.
				 * @returns An Effect that resolves to an array of page data, either as `MetaOnlyPageData[]` or `CombinedPageData[]` depending on `metaOnly`.
				 */
				packagePages: _getPackagesPages,
				/**
				 * Retrieves all pages from the database or cache, with options for including drafts,
				 * hiding the default index page, returning only metadata, and paginating results.
				 *
				 * - If caching is enabled, attempts to return cached pages and updates expired cache entries.
				 * - If caching is disabled, fetches pages directly from the database.
				 * - Supports filtering by draft status and default index visibility.
				 * - Can return either full page data or metadata only.
				 * - Supports pagination via the `paginate` parameter.
				 *
				 * @param includeDrafts - Whether to include draft pages in the results. Defaults to `false`.
				 * @param hideDefaultIndex - Whether to exclude the default index page from the results. Defaults to `false`.
				 * @param metaOnly - Whether to return only metadata for each page. Defaults to `false`.
				 * @param paginate - Optional pagination input specifying `limit` and `offset`.
				 * @returns An `Effect` that yields an array of page data or metadata, depending on `metaOnly`.
				 */
				pages: _getAllPages,
			};

			return GET;
		}),
	}
) {}
