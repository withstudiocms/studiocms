import { and, asc, desc, eq } from 'astro:db';
import { sdk as sdkConfig } from 'studiocms:config';
import { createTwoFilesPatch } from 'diff';
import { type Diff2HtmlConfig, html } from 'diff2html';
import { Effect } from 'effect';
import {
	CMSNotificationSettingsId,
	CMSSiteConfigId,
	GhostUserDefaults,
	NotificationSettingsDefaults,
	versionCacheLifetime,
} from '../consts.js';
import {
	AstroDB,
	GetVersionFromNPM,
	SDKCore_Collectors,
	SDKCore_FolderTree,
	SDKCore_Generators,
	SDKCore_Parsers,
	SDKCore_Users,
} from './effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from './errors.js';
import {
	tsAPIKeys,
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
	tsUserResetTokens,
	tsUsers,
} from './tables.js';
import type {
	BaseCacheObject,
	CombinedInsertContent,
	CombinedPageData,
	CombinedUserData,
	FolderListCacheObject,
	FolderListItem,
	FolderNode,
	FolderTreeCacheObject,
	MetaOnlyPageData,
	MetaOnlyPageDataCacheObject,
	MultiPageInsert,
	PageDataCacheObject,
	PageDataCacheReturnType,
	PaginateInput,
	SiteConfig,
	SiteConfigCacheObject,
	VersionCacheObject,
	addDatabaseEntryInsertPage,
	tsDiffTrackingInsert,
	tsNotificationSettingsInsert,
	tsOAuthAccountsSelect,
	tsPageContentInsert,
	tsPageContentSelect,
	tsPageDataCategoriesInsert,
	tsPageDataCategoriesSelect,
	tsPageDataInsert,
	tsPageDataSelect,
	tsPageDataTagsInsert,
	tsPageDataTagsSelect,
	tsPageFolderInsert,
	tsPageFolderSelect,
	tsPermissionsInsert,
	tsPermissionsSelect,
	tsSessionTableInsert,
	tsSiteConfigInsert,
	tsUserResetTokensSelect,
	tsUsersInsert,
	tsUsersSelect,
	tsUsersUpdate,
} from './types/index.js';

const cacheConfig = sdkConfig.cacheConfig;

const SiteConfigMapID: string = '__StudioCMS_Site_Config';
const VersionMapID: string = '__StudioCMS_Latest_Version';
const FolderTreeMapID: string = '__StudioCMS_Folder_Tree';
const PageFolderTreeMapID: string = '__StudioCMS_Page_Folder_Tree';
const FolderListMapID: string = '__StudioCMS_Folder_List';
const StudioCMSPkgId: string = 'studiocms';

type CacheMap<K, V> = ReadonlyMap<K, V> & Map<K, V>;

const pages: CacheMap<string, PageDataCacheObject> = new Map<string, PageDataCacheObject>();
const siteConfig: CacheMap<string, SiteConfigCacheObject> = new Map<
	string,
	SiteConfigCacheObject
>();
const version: CacheMap<string, VersionCacheObject> = new Map<string, VersionCacheObject>();
const folderTree: CacheMap<string, FolderTreeCacheObject> = new Map<
	string,
	FolderTreeCacheObject
>();
const pageFolderTree: CacheMap<string, FolderTreeCacheObject> = new Map<
	string,
	FolderTreeCacheObject
>();
const FolderList: CacheMap<string, FolderListCacheObject> = new Map<
	string,
	FolderListCacheObject
>();

const isCacheEnabled = Effect.try(() => cacheConfig.enabled);

const _ClearUnknownError = (id: string, cause: unknown) =>
	Effect.fail(
		new SDKCoreError({
			type: 'UNKNOWN',
			cause: new StudioCMS_SDK_Error(`${id} Error: ${cause}`),
		})
	);

const _clearLibSQLError = (id: string, cause: unknown) =>
	Effect.fail(
		new SDKCoreError({
			type: 'LibSQLDatabaseError',
			cause: new StudioCMS_SDK_Error(`${id} Error: ${cause}`),
		})
	);

function folderTreeReturn(data: FolderNode[]): FolderTreeCacheObject {
	return {
		data,
		lastCacheUpdate: new Date(),
	};
}

function folderListReturn(data: FolderListItem[]): FolderListCacheObject {
	return {
		data,
		lastCacheUpdate: new Date(),
	};
}

function pageDataReturn(data: CombinedPageData): PageDataCacheObject {
	return {
		data,
		lastCacheUpdate: new Date(),
	};
}

function siteConfigReturn(siteConfig: SiteConfig): SiteConfigCacheObject {
	return {
		data: siteConfig,
		lastCacheUpdate: new Date(),
	};
}

function versionReturn(version: string): VersionCacheObject {
	return {
		version,
		lastCacheUpdate: new Date(),
	};
}

function convertCombinedPageDataToMetaOnly<T extends PageDataCacheObject[] | PageDataCacheObject>(
	data: T
): PageDataCacheReturnType<T> {
	if (Array.isArray(data)) {
		return data.map(({ lastCacheUpdate, data: { defaultContent, multiLangContent, ...data } }) => ({
			lastCacheUpdate,
			data,
		})) as PageDataCacheReturnType<T>;
	}
	const {
		lastCacheUpdate,
		data: { defaultContent, multiLangContent, ...metaOnlyData },
	} = data;
	return {
		lastCacheUpdate,
		data: metaOnlyData,
	} as PageDataCacheReturnType<T>;
}

function isCacheExpired(entry: BaseCacheObject, lifetime = cacheConfig.lifetime): boolean {
	return new Date().getTime() - entry.lastCacheUpdate.getTime() > lifetime;
}

function filterPagesByDraftAndIndex(
	pages: tsPageDataSelect[],
	includeDrafts: boolean,
	hideDefaultIndex: boolean
): tsPageDataSelect[] {
	return pages.filter(
		({ draft, slug }) =>
			(includeDrafts || draft === false || draft === null) &&
			(!hideDefaultIndex || slug !== 'index')
	);
}

export class SDKCore extends Effect.Service<SDKCore>()('studiocms/sdk/SDKCore', {
	effect: Effect.gen(function* () {
		// Get Services
		const dbService = yield* AstroDB;
		const folderTreeService = yield* SDKCore_FolderTree;
		const generatorService = yield* SDKCore_Generators;
		const parseService = yield* SDKCore_Parsers;
		const userService = yield* SDKCore_Users;
		const collectorService = yield* SDKCore_Collectors;
		const getVersionFromNPM = yield* GetVersionFromNPM;

		// Breakout service functions that need to be returned in this.
		const { db } = dbService;

		const {
			getFullPath,
			findNodeByPath,
			findNodesAlongPath,
			findNodesAlongPathToId,
			findNodeById,
			addPageToFolderTree,
			buildFolderTree,
			getAvailableFolders,
		} = folderTreeService;

		const { generateRandomIDNumber, generateRandomPassword, generateToken, testToken } =
			generatorService;

		const { parseIdNumberArray, parseIdStringArray } = parseService;

		const { combineRanks, verifyRank, clearUserReferences } = userService;

		const { collectCategories, collectTags, collectPageData, collectUserData } = collectorService;

		function _getPackagesPages(
			packageName: string,
			tree?: FolderNode[]
		): Effect.Effect<CombinedPageData[], SDKCoreError, never>;
		function _getPackagesPages(
			packageName: string,
			tree?: FolderNode[],
			metaOnly?: boolean
		): Effect.Effect<MetaOnlyPageData[], SDKCoreError, never>;

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

				return pages as MetaOnlyPageData[] | CombinedPageData[];
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

			return Effect.gen(function* () {
				const status = yield* isCacheEnabled;

				if (!status) {
					const page = yield* getPage(id);

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

				const cachedPage = pages.get(id);

				if (!cachedPage || isCacheExpired(cachedPage)) {
					const page = yield* getPage(id, tree);

					if (!page) {
						return yield* Effect.fail(
							new SDKCoreError({
								type: 'UNKNOWN',
								cause: new StudioCMS_SDK_Error('Page not found in Database'),
							})
						);
					}

					const returnPage = pageDataReturn(page);

					pages.set(id, returnPage);

					return metaOnly ? convertCombinedPageDataToMetaOnly(returnPage) : returnPage;
				}

				// Return the cached page
				return metaOnly ? convertCombinedPageDataToMetaOnly(cachedPage) : cachedPage;
			}).pipe(
				Effect.catchTags({
					UnknownException: (cause) => _clearLibSQLError('GET.page.byId', cause),
					'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
						_clearLibSQLError('GET.page.byId', cause),
				})
			);
		}

		function _getPageBySlug(slug: string): Effect.Effect<PageDataCacheObject, SDKCoreError, never>;
		function _getPageBySlug(
			slug: string,
			metaOnly?: boolean
		): Effect.Effect<MetaOnlyPageDataCacheObject, SDKCoreError, never>;

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
					if (paginate) {
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
							// Either throw an error or set a default value
							paginate.limit = 10; // Default value
						}
					}

					const pagesRaw = paginate
						? yield* dbService.execute((db) =>
								db
									.select()
									.from(tsPageData)
									.orderBy(asc(tsPageData.title))
									.limit(paginate.limit)
									.offset(paginate.offset)
							)
						: yield* dbService.execute((db) =>
								db.select().from(tsPageData).orderBy(asc(tsPageData.title))
							);

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

				if (paginate) {
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
						// Either throw an error or set a default value
						paginate.limit = 10; // Default value
					}
				}

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
						const paginatedData = data
							.sort((a, b) => a.data.title.localeCompare(b.data.title))
							.slice(paginate.offset, paginate.offset + paginate.limit);
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
					const paginatedData = data
						.sort((a, b) => a.data.title.localeCompare(b.data.title))
						.slice(paginate.offset, paginate.offset + paginate.limit);
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
			id: string,
			includeDrafts?: boolean,
			hideDefaultIndex?: boolean,
			metaOnly?: false,
			paginate?: PaginateInput
		): Effect.Effect<PageDataCacheObject[], SDKCoreError, never>;
		function _folderPages(
			id: string,
			includeDrafts?: boolean,
			hideDefaultIndex?: boolean,
			metaOnly?: true,
			paginate?: PaginateInput
		): Effect.Effect<MetaOnlyPageDataCacheObject[], SDKCoreError, never>;

		function _folderPages(
			id: string,
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
					if (paginate) {
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
							// Either throw an error or set a default value
							paginate.limit = 10; // Default value
						}
					}

					const pagesRaw = paginate
						? yield* dbService.execute((db) =>
								db
									.select()
									.from(tsPageData)
									.orderBy(asc(tsPageData.title))
									.limit(paginate.limit)
									.offset(paginate.offset)
							)
						: yield* dbService.execute((db) =>
								db.select().from(tsPageData).orderBy(asc(tsPageData.title))
							);

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

				if (paginate) {
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
						// Either throw an error or set a default value
						paginate.limit = 10; // Default value
					}
				}

				if (!status) {
					const dbPages = yield* getPages(id, includeDrafts, hideDefaultIndex);
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
						.filter(({ parentFolder }) => parentFolder === id)
						.map((data) => pageDataReturn(data));

					if (paginate) {
						const paginatedData = data
							.sort((a, b) => a.data.title.localeCompare(b.data.title))
							.slice(paginate.offset, paginate.offset + paginate.limit);
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
					({ data: { parentFolder } }) => parentFolder === id
				);

				if (paginate) {
					const paginatedData = data
						.sort((a, b) => a.data.title.localeCompare(b.data.title))
						.slice(paginate.offset, paginate.offset + paginate.limit);
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

		const resetTokenBucket = {
			new: (userId: string): Effect.Effect<tsUserResetTokensSelect, SDKCoreError, never> =>
				Effect.gen(function* () {
					const token = yield* generateToken(userId);

					return yield* dbService.execute((db) =>
						db
							.insert(tsUserResetTokens)
							.values({ id: crypto.randomUUID(), userId, token })
							.returning()
							.get()
					);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`resetTokenBucket New Error: ${cause}`),
								})
							),
					})
				),
			delete: (userId: string): Effect.Effect<void, SDKCoreError, never> =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db.delete(tsUserResetTokens).where(eq(tsUserResetTokens.userId, userId))
					);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`resetTokenBucket Delete Error: ${cause}`),
								})
							),
					})
				),
			check: (token: string): Effect.Effect<boolean, SDKCoreError, never> =>
				Effect.gen(function* () {
					const { isValid, userId } = yield* testToken(token);

					if (!isValid) return false;
					if (!userId) return false;

					const resetToken = yield* dbService.execute((db) =>
						db.select().from(tsUserResetTokens).where(eq(tsUserResetTokens.userId, userId))
					);

					if (!resetToken || resetToken.length === 0) return false;

					return !!resetToken.find((t) => t.token === token);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`resetTokenBucket Check Error: ${cause}`),
								})
							),
					})
				),
		};

		const checkDiffsLengthAndRemoveOldestIfToLong = (
			pageId: string,
			length: number
		): Effect.Effect<void, SDKCoreError, never> =>
			Effect.gen(function* () {
				const diffs = yield* dbService.execute((db) =>
					db
						.select()
						.from(tsDiffTracking)
						.where(eq(tsDiffTracking.pageId, pageId))
						.orderBy(asc(tsDiffTracking.timestamp))
				);

				if (diffs.length > length) {
					const oldestDiff = diffs[0];

					yield* dbService.execute((db) =>
						db.delete(tsDiffTracking).where(eq(tsDiffTracking.id, oldestDiff.id))
					);
				}
			}).pipe(
				Effect.catchTags({
					'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
						Effect.fail(
							new SDKCoreError({
								type: 'LibSQLDatabaseError',
								cause: new StudioCMS_SDK_Error(
									`checkDiffsLengthAndRemoveOldestIfToLong Error: ${cause}`
								),
							})
						),
				})
			);

		const diffTracking = {
			insert: (
				userId: string,
				pageId: string,
				data: {
					content: {
						start: string;
						end: string;
					};
					metaData: {
						start: Partial<tsPageDataSelect>;
						end: Partial<tsPageDataSelect>;
					};
				},
				diffLength: number
			) =>
				Effect.gen(function* () {
					const diff = yield* Effect.try({
						try: () =>
							createTwoFilesPatch('Content', 'Content', data.content.start, data.content.end),
						catch: (error) =>
							new SDKCoreError({
								type: 'UNKNOWN',
								cause: new StudioCMS_SDK_Error(
									`diffTracking.insert:createTwoFilesPatch Error: ${error}`
								),
							}),
					});

					yield* checkDiffsLengthAndRemoveOldestIfToLong(pageId, diffLength);

					const inputted = yield* dbService.execute((db) =>
						db
							.insert(tsDiffTracking)
							.values({
								id: crypto.randomUUID(),
								userId,
								pageId,
								diff,
								timestamp: new Date(),
								pageContentStart: data.content.start,
								pageMetaData: JSON.stringify(data.metaData),
							})
							.returning()
							.get()
					);

					return yield* parseService.fixDiff(inputted);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`diffTracking.insert Error: ${cause}`),
								})
							),
					})
				),
			clear: (pageId: string) =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db.delete(tsDiffTracking).where(eq(tsDiffTracking.pageId, pageId))
					);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`diffTracking.clear Error: ${cause}`),
								})
							),
					})
				),
			get: {
				byPageId: {
					all: (pageId: string) =>
						Effect.gen(function* () {
							const items = yield* dbService.execute((db) =>
								db
									.select()
									.from(tsDiffTracking)
									.where(eq(tsDiffTracking.pageId, pageId))
									.orderBy(desc(tsDiffTracking.timestamp))
							);

							return yield* parseService.fixDiff(items);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`diffTracking.get.byPageId.all Error: ${cause}`
											),
										})
									),
							})
						),
					latest: (pageId: string, count: number) =>
						Effect.gen(function* () {
							const items = yield* dbService.execute((db) =>
								db
									.select()
									.from(tsDiffTracking)
									.where(eq(tsDiffTracking.pageId, pageId))
									.orderBy(desc(tsDiffTracking.timestamp))
							);

							const split = items.slice(0, count);

							return yield* parseService.fixDiff(split);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`diffTracking.get.byPageId.latest Error: ${cause}`
											),
										})
									),
							})
						),
				},
				byUserId: {
					all: (userId: string) =>
						Effect.gen(function* () {
							const items = yield* dbService.execute((db) =>
								db
									.select()
									.from(tsDiffTracking)
									.where(eq(tsDiffTracking.userId, userId))
									.orderBy(desc(tsDiffTracking.timestamp))
							);

							return yield* parseService.fixDiff(items);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`diffTracking.get.byUserId.all Error: ${cause}`
											),
										})
									),
							})
						),
					latest: (userId: string, count: number) =>
						Effect.gen(function* () {
							const items = yield* dbService.execute((db) =>
								db
									.select()
									.from(tsDiffTracking)
									.where(eq(tsDiffTracking.userId, userId))
									.orderBy(desc(tsDiffTracking.timestamp))
							);

							const split = items.slice(0, count);

							return parseService.fixDiff(split);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`diffTracking.get.byUserId.latest Error: ${cause}`
											),
										})
									),
							})
						),
				},
				single: (id: string) =>
					Effect.gen(function* () {
						const data = yield* dbService.execute((db) =>
							db.select().from(tsDiffTracking).where(eq(tsDiffTracking.id, id)).get()
						);
						if (!data) return;
						return yield* parseService.fixDiff(data);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`diffTracking.get.single Error: ${cause}`),
									})
								),
						})
					),
			},
			revertToDiff: (id: string, type: 'content' | 'data' | 'both') =>
				Effect.gen(function* () {
					const diffEntry = yield* dbService.execute((db) =>
						db.select().from(tsDiffTracking).where(eq(tsDiffTracking.id, id)).get()
					);

					if (!diffEntry) {
						return yield* Effect.fail(
							new SDKCoreError({
								type: 'UNKNOWN',
								cause: new StudioCMS_SDK_Error('Diff not found'),
							})
						);
					}

					const shouldRevertData = type === 'data' || type === 'both';
					const shouldRevertContent = type === 'content' || type === 'both';

					if (shouldRevertData) {
						const pageData = yield* Effect.try(() => JSON.parse(diffEntry.pageMetaData as string));

						yield* dbService.execute((db) =>
							db.update(tsPageData).set(pageData.start).where(eq(tsPageData.id, pageData.end.id))
						);
					}

					if (shouldRevertContent) {
						yield* dbService.execute((db) =>
							db
								.update(tsPageContent)
								.set({ content: diffEntry.pageContentStart })
								.where(eq(tsPageContent.contentId, diffEntry.pageId))
						);
					}

					const allDiffs = yield* dbService.execute((db) =>
						db
							.select()
							.from(tsDiffTracking)
							.where(eq(tsDiffTracking.pageId, diffEntry.pageId))
							.orderBy(desc(tsDiffTracking.timestamp))
					);

					const diffIndex = allDiffs.findIndex((diff) => diff.id === id);

					const diffsToPurge = allDiffs.slice(diffIndex + 1);

					const purgeDiff = dbService.makeQuery((ex, id: string) =>
						ex((db) => db.delete(tsDiffTracking).where(eq(tsDiffTracking.id, id)))
					);

					for (const { id } of diffsToPurge) {
						yield* purgeDiff(id);
					}

					return yield* parseService.fixDiff(diffEntry);
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`diffTracking.revertToDiff Error: ${cause}`),
								})
							),
						UnknownException: (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'UNKNOWN',
									cause: new StudioCMS_SDK_Error(`diffTracking.revertToDiff Error: ${cause}`),
								})
							),
					})
				),
			utils: {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				getMetaDataDifferences: <T extends Record<string, any>>(obj1: T, obj2: T) =>
					Effect.gen(function* () {
						// biome-ignore lint/suspicious/noExplicitAny: <explanation>
						const differences: { label: string; previous: any; current: any }[] = [];

						const Labels: Record<string, string> = {
							package: 'Page Type',
							title: 'Page Title',
							description: 'Page Description',
							showOnNav: 'Show in Navigation',
							slug: 'Page Slug',
							contentLang: 'Content Language',
							heroImage: 'Hero/OG Image',
							categories: 'Page Categories',
							tags: 'Page Tags',
							showAuthor: 'Show Author',
							showContributors: 'Show Contributors',
							parentFolder: 'Parent Folder',
							draft: 'Draft',
						};

						const processLabel = (label: string) =>
							Effect.try(() => (Labels[label] ? Labels[label] : label));

						for (const label in obj1) {
							const blackListedLabels: string[] = [
								'publishedAt',
								'updatedAt',
								'authorId',
								'contributorIds',
							];
							if (blackListedLabels.includes(label)) continue;

							// biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
							if (obj1.hasOwnProperty(label) && obj2.hasOwnProperty(label)) {
								if (obj1[label] !== obj2[label]) {
									if (Array.isArray(obj1[label]) && Array.isArray(obj2[label])) {
										if (obj1[label].length === obj2[label].length) continue;
									}
									differences.push({
										label: yield* processLabel(label),
										previous: obj1[label],
										current: obj2[label],
									});
								}
							}
						}

						return differences;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'UNKNOWN',
										cause: new StudioCMS_SDK_Error(
											`diffTracking.utils.getMetaDataDifferences Error: ${cause}`
										),
									})
								),
						})
					),
				getDiffHTML: (diff: string | null, options?: Diff2HtmlConfig) =>
					Effect.try({
						try: () =>
							html(diff || '', {
								diffStyle: 'word',
								matching: 'lines',
								drawFileList: false,
								outputFormat: 'side-by-side',
								...options,
							}),
						catch: (cause) =>
							new SDKCoreError({
								type: 'UNKNOWN',
								cause: new StudioCMS_SDK_Error(`diffTracking.utils.getDiffHTML Error: ${cause}`),
							}),
					}),
			},
		};

		const notificationSettings = {
			site: {
				get: () =>
					Effect.gen(function* () {
						const data = yield* dbService.execute((db) =>
							db
								.select()
								.from(tsNotificationSettings)
								.where(eq(tsNotificationSettings.id, CMSNotificationSettingsId))
								.get()
						);

						if (!data) {
							return yield* dbService.execute((db) =>
								db
									.insert(tsNotificationSettings)
									.values(NotificationSettingsDefaults)
									.returning()
									.get()
							);
						}

						return data;
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`notificationSettings.site.get Error: ${cause}`),
									})
								),
						})
					),
				update: dbService.makeQuery((ex, settings: tsNotificationSettingsInsert) =>
					ex((db) =>
						db
							.update(tsNotificationSettings)
							.set(settings)
							.where(eq(tsNotificationSettings.id, CMSNotificationSettingsId))
							.returning()
							.get()
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(
											`notificationSettings.site.update Error: ${cause}`
										),
									})
								),
						})
					)
				),
			},
		};

		const INIT = {
			/**
			 * Initializes the StudioCMS SiteConfig table with the provided configuration.
			 *
			 * @param config - The configuration to insert into the SiteConfig table.
			 * @returns A promise that resolves to the inserted site configuration.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the site configuration.
			 */
			siteConfig: (config: tsSiteConfigInsert) =>
				dbService
					.execute((db) =>
						db
							.insert(tsSiteConfig)
							.values({ ...config, id: CMSSiteConfigId })
							.returning()
							.get()
					)
					.pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`INIT.siteConfig Error: ${cause}`),
									})
								),
						})
					),
			/**
			 * Initializes the StudioCMS Ghost User.
			 *
			 * The ghost user is a default user that is used to perform actions on behalf of the system as well as to replace deleted users.
			 *
			 * @returns A promise that resolves to the ghost user record.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the ghost user.
			 */
			ghostUser: () =>
				Effect.gen(function* () {
					const ghostUser = yield* AUTH.user.ghost.verifyExists();
					if (!ghostUser) return yield* AUTH.user.ghost.create();
					const ghostUserRecord = yield* AUTH.user.ghost.get();
					if (!ghostUserRecord) {
						yield* Effect.fail(
							new SDKCoreError({
								type: 'LibSQLDatabaseError',
								cause: new StudioCMS_SDK_Error(
									'INIT.ghostUser Error: Error getting ghost user from database: The ghost user may not exist yet.'
								),
							})
						);
						return void 0;
					}
					return ghostUserRecord;
				}),
		};

		const AUTH = {
			verifyEmail: {
				get: dbService.makeQuery((ex, id: string) =>
					ex((db) =>
						db
							.select()
							.from(tsEmailVerificationTokens)
							.where(eq(tsEmailVerificationTokens.id, id))
							.get()
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`AUTH.verifyEmail.get Error: ${cause}`),
									})
								),
						})
					)
				),
				create: (userId: string) =>
					Effect.gen(function* () {
						yield* dbService.execute((db) =>
							db
								.delete(tsEmailVerificationTokens)
								.where(eq(tsEmailVerificationTokens.userId, userId))
						);

						const token = yield* generateToken(userId);

						return yield* dbService.execute((db) =>
							db
								.insert(tsEmailVerificationTokens)
								.values({
									id: crypto.randomUUID(),
									userId,
									token,
									expiresAt: new Date(Date.now() + 1000 * 60 * 10),
								})
								.returning()
								.get()
						);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`AUTH.verifyEmail.create Error: ${cause}`),
									})
								),
						})
					),
				delete: dbService.makeQuery((ex, userId: string) =>
					ex((db) =>
						db.delete(tsEmailVerificationTokens).where(eq(tsEmailVerificationTokens.userId, userId))
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`AUTH.verifyEmail.delete Error: ${cause}`),
									})
								),
						})
					)
				),
			},
			oAuth: {
				/**
				 * Creates a new OAuth account in the database.
				 *
				 * @param data - The data to insert into the OAuth account table.
				 * @returns A promise that resolves to the inserted OAuth account.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the OAuth account.
				 */
				create: dbService.makeQuery((ex, data: tsOAuthAccountsSelect) =>
					ex((db) => db.insert(tsOAuthAccounts).values(data).returning().get()).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`AUTH.oAuth.create Error: ${cause}`),
									})
								),
						})
					)
				),
				/**
				 * Deletes an OAuth account from the database.
				 *
				 * @param userId - The ID of the user associated with the OAuth account.
				 * @param provider - The provider of the OAuth account.
				 * @returns A promise that resolves to a deletion response.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the OAuth account.
				 */
				delete: (userId: string, provider: string) =>
					Effect.gen(function* () {
						yield* dbService.execute((db) =>
							db
								.delete(tsOAuthAccounts)
								.where(
									and(eq(tsOAuthAccounts.userId, userId), eq(tsOAuthAccounts.provider, provider))
								)
						);

						return {
							status: 'success',
							message: 'OAuth account deleted',
						};
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`AUTH.oAuth.delete Error: ${cause}`),
									})
								),
						})
					),
				/**
				 * Searches for OAuth accounts based on the provider ID and user ID.
				 *
				 * @param providerId - The provider ID to search for.
				 * @param userId - The user ID to search for.
				 * @returns A promise that resolves to the OAuth account data if found, otherwise undefined.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while searching for the OAuth account.
				 */
				searchProvidersForId: (providerId: string, userId: string) =>
					dbService
						.execute((db) =>
							db
								.select()
								.from(tsOAuthAccounts)
								.where(
									and(
										eq(tsOAuthAccounts.providerUserId, providerId),
										eq(tsOAuthAccounts.userId, userId)
									)
								)
								.get()
						)
						.pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`AUTH.oAuth.searchProviderForId Error: ${cause}`
											),
										})
									),
							})
						),
			},
			permission: {
				/**
				 * Checks the current status of a user's permissions.
				 */
				currentStatus: dbService.makeQuery((ex, userId: string) =>
					ex((db) =>
						db.select().from(tsPermissions).where(eq(tsPermissions.user, userId)).get()
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`AUTH.permission.currentStatus Error: ${cause}`),
									})
								),
						})
					)
				),
			},
			session: {
				/**
				 * Creates a new session in the database.
				 *
				 * @param data - The data to insert into the session table.
				 * @returns A promise that resolves to the inserted session.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the session.
				 */
				create: dbService.makeQuery((ex, data: tsSessionTableInsert) =>
					ex((db) =>
						db
							.insert(tsSessionTable)
							.values(data)
							.returning({
								id: tsSessionTable.id,
								userId: tsSessionTable.userId,
								expiresAt: tsSessionTable.expiresAt,
							})
							.get()
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`AUTH.session.create Error: ${cause}`),
									})
								),
						})
					)
				),
				/**
				 * Gets a session with the associated user.
				 *
				 * @param sessionId - The ID of the session to search for.
				 * @returns A promise that resolves to the session with the associated user.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the session with the user.
				 */
				sessionWithUser: dbService.makeQuery((ex, sessionId: string) =>
					ex((db) =>
						db
							.select({ user: tsUsers, session: tsSessionTable })
							.from(tsSessionTable)
							.innerJoin(tsUsers, eq(tsSessionTable.userId, tsUsers.id))
							.where(eq(tsSessionTable.id, sessionId))
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`AUTH.session.sessionWithUser Error: ${cause}`),
									})
								),
						})
					)
				),
				/**
				 * Deletes a session from the database.
				 *
				 * @param sessionId - The ID of the session to delete.
				 * @returns A promise that resolves to a deletion response.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the session.
				 */
				delete: dbService.makeQuery((ex, sessionId: string) =>
					ex((db) =>
						db
							.delete(tsSessionTable)
							.where(eq(tsSessionTable.id, sessionId))
							.then(() => ({
								status: 'success',
								message: 'Session deleted',
							}))
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`AUTH.session.delete Error: ${cause}`),
									})
								),
						})
					)
				),
				/**
				 * Updates the expiration date of a session.
				 *
				 * @param sessionId - The ID of the session to update.
				 * @param newDate - The new expiration date for the session.
				 * @returns A promise that resolves to the updated session.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the session.
				 */
				update: (sessionId: string, newDate: Date) =>
					dbService
						.execute((db) =>
							db
								.update(tsSessionTable)
								.set({ expiresAt: newDate })
								.where(eq(tsSessionTable.id, sessionId))
								.returning()
						)
						.pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`AUTH.session.update Error: ${cause}`),
										})
									),
							})
						),
			},
			user: {
				/**
				 * Creates a new user in the database.
				 *
				 * @param newUserData - The data to insert into the users table.
				 * @returns A promise that resolves to the inserted user.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the user.
				 */
				create: (newUserData: tsUsersInsert, rank?: 'visitor' | 'editor' | 'admin' | 'owner') =>
					Effect.gen(function* () {
						const newUser = yield* dbService.execute((db) =>
							db.insert(tsUsers).values(newUserData).returning().get()
						);
						yield* dbService.execute((db) =>
							db.insert(tsPermissions).values({ user: newUser.id, rank: rank || 'visitor' })
						);
						return newUser;
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`AUTH.user.create Error: ${cause}`),
									})
								),
						})
					),
				/**
				 * Updates a user in the database.
				 *
				 * @param userId - The ID of the user to update.
				 * @param userData - The data to update the user with.
				 * @returns A promise that resolves to the updated user.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the user.
				 */
				update: (userId: string, userData: tsUsersUpdate) =>
					dbService
						.execute((db) =>
							db.update(tsUsers).set(userData).where(eq(tsUsers.id, userId)).returning().get()
						)
						.pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`AUTH.user.update Error: ${cause}`),
										})
									),
							})
						),
				/**
				 * Searches for users based on the provided username or email.
				 *
				 * @param username - The username to search for.
				 * @param email - The email to search for.
				 * @returns A promise that resolves to an object containing the search results for the username and email.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while searching for the username or email.
				 */
				searchUsersForUsernameOrEmail: (username = '', email = '') =>
					Effect.gen(function* () {
						const usernameSearch = yield* dbService.execute((db) =>
							db.select().from(tsUsers).where(eq(tsUsers.username, username))
						);
						const emailSearch = yield* dbService.execute((db) =>
							db.select().from(tsUsers).where(eq(tsUsers.email, email))
						);

						return { usernameSearch, emailSearch };
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(
											`AUTH.user.searchUsersForUsernameOrEmail Error: ${cause}`
										),
									})
								),
						})
					),
				ghost: {
					/**
					 * Verifies if the ghost user exists in the database.
					 *
					 * @returns A promise that resolves to a boolean indicating if the ghost user exists.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while verifying the ghost user.
					 */
					verifyExists: () =>
						Effect.gen(function* () {
							const ghostUser = yield* dbService.execute((db) =>
								db.select().from(tsUsers).where(eq(tsUsers.id, GhostUserDefaults.id)).get()
							);
							if (!ghostUser) return false;
							return true;
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`AUTH.user.ghost.verifyExists Error: ${cause}`
											),
										})
									),
							})
						),
					/**
					 * Creates the ghost user in the database.
					 *
					 * @returns A promise that resolves to the inserted ghost user.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the ghost user.
					 */
					create: () =>
						dbService
							.execute((db) => db.insert(tsUsers).values(GhostUserDefaults).returning().get())
							.pipe(
								Effect.catchTags({
									'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
										Effect.fail(
											new SDKCoreError({
												type: 'LibSQLDatabaseError',
												cause: new StudioCMS_SDK_Error(`AUTH.user.ghost.create Error: ${cause}`),
											})
										),
								})
							),
					/**
					 * Gets the ghost user from the database.
					 *
					 * @returns A promise that resolves to the ghost user.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the ghost user.
					 */
					get: () =>
						dbService
							.execute((db) =>
								db.select().from(tsUsers).where(eq(tsUsers.id, GhostUserDefaults.id)).get()
							)
							.pipe(
								Effect.catchTags({
									'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
										Effect.fail(
											new SDKCoreError({
												type: 'LibSQLDatabaseError',
												cause: new StudioCMS_SDK_Error(`AUTH.user.ghost.get Error: ${cause}`),
											})
										),
								})
							),
				},
			},
		};

		const DELETE = {
			/**
			 * Deletes a page from the database.
			 *
			 * @param id - The ID of the page to delete.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page.
			 */
			page: (id: string) =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db.delete(tsDiffTracking).where(eq(tsDiffTracking.pageId, id))
					);
					yield* dbService.execute((db) =>
						db.delete(tsPageContent).where(eq(tsPageContent.contentId, id))
					);
					yield* dbService.execute((db) => db.delete(tsPageData).where(eq(tsPageData.id, id)));

					yield* CLEAR.pages();
					return {
						status: 'success',
						message: `Page with ID ${id} has been deleted successfully`,
					};
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('DELETE.page', cause),
					})
				),
			/**
			 * Deletes a page content from the database.
			 *
			 * @param id - The ID of the page content to delete.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page content.
			 */
			pageContent: (id: string) =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db.delete(tsPageContent).where(eq(tsPageContent.contentId, id))
					);
					return {
						status: 'success',
						message: `Page content with ID ${id} has been deleted successfully`,
					};
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('DELETE.pageContent', cause),
					})
				),
			/**
			 * Deletes a page content lang from the database.
			 *
			 * @param id - The ID of the page content to delete.
			 * @param lang - The lang of the page content to delete.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the page content lang.
			 */
			pageContentLang: (id: string, lang: string) =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db
							.delete(tsPageContent)
							.where(and(eq(tsPageContent.contentId, id), eq(tsPageContent.contentLang, lang)))
					);
					return {
						status: 'success',
						message: `Page content with ID ${id} and lang ${lang} has been deleted successfully`,
					};
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('DELETE.pageContentLang', cause),
					})
				),
			/**
			 * Deletes a tag from the database.
			 *
			 * @param id - The ID of the tag to delete.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the tag.
			 */
			tags: (id: number) =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db.delete(tsPageDataTags).where(eq(tsPageDataTags.id, id))
					);
					return {
						status: 'success',
						message: `Tag with ID ${id} has been deleted successfully`,
					};
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('DELETE.tags', cause),
					})
				),
			/**
			 * Deletes a category from the database.
			 *
			 * @param id - The ID of the category to delete.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the category.
			 */
			categories: (id: number) =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db.delete(tsPageDataCategories).where(eq(tsPageDataCategories.id, id))
					);
					return {
						status: 'success',
						message: `Category with ID ${id} has been deleted successfully`,
					};
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('DELETE.categories', cause),
					})
				),
			/**
			 * Deletes a permission from the database.
			 *
			 * @param userId - The ID of the user to delete the permission for.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the permission.
			 */
			permissions: (userId: string) =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db.delete(tsPermissions).where(eq(tsPermissions.user, userId))
					);
					return {
						status: 'success',
						message: `Permissions for user with ID ${userId} have been deleted successfully`,
					};
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('DELETE.permissions', cause),
					})
				),
			/**
			 * Deletes a site configuration from the database.
			 *
			 * @param id - The ID of the site configuration to delete.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the site configuration.
			 */
			diffTracking: (id: string) =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db.delete(tsDiffTracking).where(eq(tsDiffTracking.id, id))
					);
					return {
						status: 'success',
						message: `Diff tracking with ID ${id} has been deleted successfully`,
					};
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('DELETE.diffTracking', cause),
					})
				),
			/**
			 * Deletes a folder from the database.
			 *
			 * @param id - The ID of the folder to delete.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the folder.
			 */
			folder: (id: string) =>
				Effect.gen(function* () {
					yield* dbService.execute((db) =>
						db.delete(tsPageFolderStructure).where(eq(tsPageFolderStructure.id, id))
					);

					yield* CLEAR.folderList();
					yield* CLEAR.folderTree();

					yield* UPDATE.folderList;
					yield* UPDATE.folderTree;

					return {
						status: 'success',
						message: `Folder with ID ${id} has been deleted successfully`,
					};
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('DELETE.folder', cause),
					})
				),
			/**
			 * Deletes a user from the database.
			 *
			 * @param id - The ID of the user to delete.
			 * @returns A promise that resolves to a deletion response.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the user.
			 */
			user: (id: string) =>
				Effect.gen(function* () {
					if (id === GhostUserDefaults.id) {
						yield* _clearLibSQLError(
							'DELETE.user',
							`User with ID ${id} is an internal user and cannot be deleted.`
						);
						return void 0;
					}

					const verifyNoReference = yield* clearUserReferences(id);

					if (!verifyNoReference) {
						yield* _clearLibSQLError(
							'DELETE.user',
							`There was an issue deleting User with ID ${id}. Please manually remove all references before deleting the user. Or try again.`
						);
						return void 0;
					}

					yield* dbService.execute((db) => db.delete(tsUsers).where(eq(tsUsers.id, id)));

					return {
						status: 'success',
						message: `User with ID ${id} has been deleted successfully`,
					};
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('DELETE.user', cause),
					})
				),
		};

		const CLEAR = {
			page: {
				byId: (id: string) =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;
						if (!status) return;

						pages.delete(id);
						return;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _ClearUnknownError('CLEAR.page.byId', cause),
						})
					),
				bySlug: (slug: string) =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;
						if (!status) return;

						const keyIndex: string[] = [];

						for (const [key, cachedObject] of pages) {
							if (cachedObject.data.slug === slug) {
								keyIndex.push(key);
							}
						}

						for (const key of keyIndex) {
							pages.delete(key);
						}

						return;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _ClearUnknownError('CLEAR.page.bySlug', cause),
						})
					),
			},
			pages: () =>
				Effect.gen(function* () {
					const status = yield* isCacheEnabled;
					if (!status) return;

					pages.clear();
					pageFolderTree.clear();
					folderTree.clear();
					FolderList.clear();
					return;
				}).pipe(
					Effect.catchTags({
						UnknownException: (cause) => _ClearUnknownError('CLEAR.pages', cause),
					})
				),
			latestVersion: () =>
				Effect.gen(function* () {
					const status = yield* isCacheEnabled;
					if (!status) return;

					version.clear();
					return;
				}).pipe(
					Effect.catchTags({
						UnknownException: (cause) => _ClearUnknownError('CLEAR.latestVersion', cause),
					})
				),
			folderTree: () =>
				Effect.gen(function* () {
					const status = yield* isCacheEnabled;
					if (!status) return;

					folderTree.clear();
					pageFolderTree.clear();
					return;
				}).pipe(
					Effect.catchTags({
						UnknownException: (cause) => _ClearUnknownError('CLEAR.folderTree', cause),
					})
				),
			folderList: () =>
				Effect.gen(function* () {
					const status = yield* isCacheEnabled;
					if (!status) return;

					FolderList.clear();
					return;
				}).pipe(
					Effect.catchTags({
						UnknownException: (cause) => _ClearUnknownError('CLEAR.folderList', cause),
					})
				),
		};

		const REST_API = {
			tokens: {
				get: dbService.makeQuery((ex, userId: string) =>
					ex((db) => db.select().from(tsAPIKeys).where(eq(tsAPIKeys.userId, userId))).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('REST_API.tokens.get', cause),
						})
					)
				),
				new: (userId: string, description: string) =>
					Effect.gen(function* () {
						const key = yield* generateToken(userId, true);

						return yield* dbService.execute((db) =>
							db
								.insert(tsAPIKeys)
								.values({
									id: crypto.randomUUID(),
									creationDate: new Date(),
									userId,
									key,
									description,
								})
								.returning()
								.get()
						);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('REST_API.tokens.new', cause),
						})
					),
				delete: (userId: string, tokenId: string) =>
					dbService
						.execute((db) =>
							db
								.delete(tsAPIKeys)
								.where(and(eq(tsAPIKeys.userId, userId), eq(tsAPIKeys.id, tokenId)))
						)
						.pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('REST_API.tokens.delete', cause),
							})
						),
				verify: (key: string) =>
					Effect.gen(function* () {
						const apiKey = yield* dbService.execute((db) =>
							db.select().from(tsAPIKeys).where(eq(tsAPIKeys.key, key)).get()
						);

						if (!apiKey) return false;

						const keyRank = yield* dbService.execute((db) =>
							db.select().from(tsPermissions).where(eq(tsPermissions.user, apiKey.userId)).get()
						);

						if (!keyRank) return false;

						return {
							userId: apiKey.userId,
							key: apiKey.key,
							rank: keyRank.rank,
						};
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('REST_API.tokens.verify', cause),
						})
					),
			},
		};

		const GET = {
			databaseTable: {
				users: () => dbService.execute((db) => db.select().from(tsUsers)),
				oAuthAccounts: () => dbService.execute((db) => db.select().from(tsOAuthAccounts)),
				sessionTable: () => dbService.execute((db) => db.select().from(tsSessionTable)),
				permissions: () => dbService.execute((db) => db.select().from(tsPermissions)),
				pageData: () => dbService.execute((db) => db.select().from(tsPageData)),
				pageDataTags: () => dbService.execute((db) => db.select().from(tsPageDataTags)),
				pageDataCategories: () => dbService.execute((db) => db.select().from(tsPageDataCategories)),
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
				owners: () =>
					Effect.gen(function* () {
						const currentPermittedUsers = yield* dbService.execute((db) =>
							db.select().from(tsPermissions)
						);
						const existingUsers = yield* dbService.execute((db) => db.select().from(tsUsers));

						return yield* verifyRank(existingUsers, currentPermittedUsers, 'owner');
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('GET.permissionsLists.owners', cause),
						})
					),
				/**
				 * Retrieves all admins in the database.
				 *
				 * @returns A promise that resolves to an array of combined rank data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the admins.
				 */
				admins: () =>
					Effect.gen(function* () {
						const currentPermittedUsers = yield* dbService.execute((db) =>
							db.select().from(tsPermissions)
						);
						const existingUsers = yield* dbService.execute((db) => db.select().from(tsUsers));

						return yield* verifyRank(existingUsers, currentPermittedUsers, 'admin');
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('GET.permissionsLists.admins', cause),
						})
					),
				/**
				 * Retrieves all editors in the database.
				 *
				 * @returns A promise that resolves to an array of combined rank data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the editors.
				 */
				editors: () =>
					Effect.gen(function* () {
						const currentPermittedUsers = yield* dbService.execute((db) =>
							db.select().from(tsPermissions)
						);
						const existingUsers = yield* dbService.execute((db) => db.select().from(tsUsers));

						return yield* verifyRank(existingUsers, currentPermittedUsers, 'editor');
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('GET.permissionsLists.editors', cause),
						})
					),
				/**
				 * Retrieves all visitors in the database.
				 *
				 * @returns A promise that resolves to an array of combined rank data.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the visitors.
				 */
				visitors: () =>
					Effect.gen(function* () {
						const currentPermittedUsers = yield* dbService.execute((db) =>
							db.select().from(tsPermissions)
						);
						const existingUsers = yield* dbService.execute((db) => db.select().from(tsUsers));

						return yield* verifyRank(existingUsers, currentPermittedUsers, 'visitor');
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('GET.permissionsLists.visitors', cause),
						})
					),
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
			siteConfig: () =>
				Effect.gen(function* () {
					const status = yield* isCacheEnabled;

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
				byId: _getPageById,
				bySlug: _getPageBySlug,
			},
			folderPages: _folderPages,
			packagePages: _getPackagesPages,
			pages: _getAllPages,
		};

		const POST = {
			databaseEntry: {
				/**
				 * Insert a new page into the database.
				 *
				 * @param pageData - The data to insert into the page data table.
				 * @param pageContent - The data to insert into the page content table.
				 * @returns A promise that resolves to the inserted page data and page content.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the page.
				 */
				pages: (pageData: tsPageDataInsert, pageContent: CombinedInsertContent) =>
					Effect.gen(function* () {
						const newContentID = pageData.id || crypto.randomUUID().toString();

						const {
							id = newContentID,
							title,
							slug,
							description,
							authorId = null,
							package: packageName = 'studiocms',
							contentLang = 'default',
							heroImage = '',
							showOnNav = false,
							showAuthor = false,
							showContributors = false,
							categories = [],
							tags = [],
							contributorIds = [],
							draft = false,
							parentFolder = null,
						} = pageData;

						const stringified = {
							categories: categories || [],
							tags: tags || [],
							contributorIds: contributorIds || [],
						};

						const contentData = {
							id: crypto.randomUUID().toString(),
							contentId: newContentID,
							contentLang: contentLang,
							content: pageContent.content || '',
						};

						const NOW = new Date();

						const newPageData = yield* dbService.execute((db) =>
							db
								.insert(tsPageData)
								.values({
									id,
									title,
									slug,
									description,
									authorId,
									contentLang,
									heroImage,
									showAuthor,
									showContributors,
									showOnNav,
									draft,
									parentFolder,
									package: packageName,
									publishedAt: NOW,
									updatedAt: NOW,
									...stringified,
								})
								.returning({ id: tsPageData.id })
						);

						const newPageContent = yield* dbService.execute((db) =>
							db.insert(tsPageContent).values(contentData).returning({ id: tsPageContent.id })
						);

						return {
							pageData: newPageData,
							pageContent: newPageContent,
						} as addDatabaseEntryInsertPage;
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('POST.databaseEntry.pages', cause),
						})
					),
				/**
				 * Inserts new page content into the database.
				 *
				 * @param pageContent - The data to insert into the page content table.
				 * @returns A promise that resolves to the inserted page content.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the page content.
				 */
				pageContent: dbService.makeQuery((ex, pageContent: tsPageContentInsert) =>
					ex((db) =>
						db
							.insert(tsPageContent)
							.values({
								id: pageContent.id || crypto.randomUUID().toString(),
								contentId: pageContent.contentId,
								contentLang: pageContent.contentLang || 'default',
								content: pageContent.content || '',
							})
							.returning({ id: tsPageContent.id })
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('POST.databaseEntry.pageContent', cause),
						})
					)
				),
				/**
				 * Inserts a new tag into the database.
				 *
				 * @param tag - The data to insert into the page data tags table.
				 * @returns A promise that resolves to the inserted tag.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the tag.
				 */
				tags: (tag: tsPageDataTagsInsert) =>
					Effect.gen(function* () {
						const id = tag.id || (yield* generateRandomIDNumber(9));

						return yield* dbService.execute((db) =>
							db
								.insert(tsPageDataTags)
								.values({
									name: tag.name,
									description: tag.description,
									slug: tag.slug,
									meta: JSON.stringify(tag.meta),
									id,
								})
								.returning({ id: tsPageDataTags.id })
						);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('POST.databaseEntry.tags', cause),
						})
					),
				/**
				 * Inserts a new category into the database.
				 *
				 * @param category - The data to insert into the page data categories table.
				 * @returns A promise that resolves to the inserted category.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the category.
				 */
				categories: (category: tsPageDataCategoriesInsert) =>
					Effect.gen(function* () {
						const id = category.id || (yield* generateRandomIDNumber(9));

						return yield* dbService.execute((db) =>
							db
								.insert(tsPageDataCategories)
								.values({
									name: category.name,
									description: category.description,
									slug: category.slug,
									meta: JSON.stringify(category.meta),
									id,
								})
								.returning({ id: tsPageDataCategories.id })
						);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('POST.databaseEntry.tags', cause),
						})
					),
				/**
				 * Inserts a new permission into the database.
				 *
				 * @param userId - The ID of the user to assign the rank to.
				 * @param rank - The rank to assign to the user.
				 * @returns A promise that resolves to the inserted permission.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the permission.
				 */
				permissions: (userId: string, rank: string) =>
					Effect.gen(function* () {
						const userExists = yield* dbService.execute((db) =>
							db.select().from(tsPermissions).where(eq(tsPermissions.user, userId)).get()
						);

						if (userExists) {
							return yield* Effect.fail(
								yield* _clearLibSQLError(
									'POST.databaseEntry.permissions',
									'User already is already assigned a rank, please update the existing rank instead.'
								)
							);
						}

						return yield* dbService.execute((db) =>
							db
								.insert(tsPermissions)
								.values({
									user: userId,
									rank,
								})
								.returning({ user: tsPermissions.user, rank: tsPermissions.rank })
						);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('POST.databaseEntry.permissions', cause),
						})
					),
				/**
				 * Inserts a new diff tracking entry into the database.
				 *
				 * @param diff - The data to insert into the diff tracking table.
				 * @returns A promise that resolves to the inserted diff tracking entry.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the diff tracking entry.
				 */
				diffTracking: dbService.makeQuery((ex, diff: tsDiffTrackingInsert) =>
					ex((db) =>
						db
							.insert(tsDiffTracking)
							.values({
								id: diff.id || crypto.randomUUID().toString(),
								userId: diff.userId,
								pageId: diff.pageId,
								diff: diff.diff || '',
								timestamp: diff.timestamp || new Date(),
								pageContentStart: diff.pageContentStart,
								pageMetaData: JSON.stringify(diff.pageMetaData || {}),
							})
							.returning()
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('POST.databaseEntry.diffTracking', cause),
						})
					)
				),
				/**
				 * Inserts a new folder into the database.
				 *
				 * @param folder - The data to insert into the page folder structure table.
				 * @returns A promise that resolves to the inserted folder.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the folder.
				 */
				folder: dbService.makeQuery((ex, folder: tsPageFolderInsert) =>
					ex((db) =>
						db
							.insert(tsPageFolderStructure)
							.values({
								id: folder.id || crypto.randomUUID().toString(),
								name: folder.name,
								parent: folder.parent || null,
							})
							.returning()
							.get()
					).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('POST.databaseEntry.folder', cause),
						})
					)
				),
			},
			databaseEntries: {
				/**
				 * Inserts multiple tags into the database.
				 *
				 * @param data - The data to insert into the page data tags table.
				 * @returns A promise that resolves to the inserted tags.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the tags.
				 */
				tags: (data: tsPageDataTagsInsert[]) =>
					Effect.gen(function* () {
						const entries: tsPageDataTagsInsert[] = [];

						for (const item of data) {
							const id = item.id || (yield* generateRandomIDNumber(9));
							entries.push({
								id,
								name: item.name,
								slug: item.slug,
								description: item.description,
								meta: JSON.stringify(item.meta),
							});
						}

						return yield* dbService.execute((db) =>
							db.insert(tsPageDataTags).values(entries).returning({ id: tsPageDataTags.id })
						);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('POST.databaseEntries.tags', cause),
						})
					),
				/**
				 * Inserts multiple categories into the database.
				 *
				 * @param data - The data to insert into the page data categories table.
				 * @returns A promise that resolves to the inserted categories.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the categories.
				 */
				categories: (data: tsPageDataCategoriesInsert[]) =>
					Effect.gen(function* () {
						const entries: tsPageDataCategoriesInsert[] = [];

						for (const item of data) {
							const id = item.id || (yield* generateRandomIDNumber(9));
							entries.push({
								id,
								name: item.name,
								slug: item.slug,
								description: item.description,
								meta: JSON.stringify(item.meta),
							});
						}

						return yield* dbService.execute((db) =>
							db
								.insert(tsPageDataCategories)
								.values(entries)
								.returning({ id: tsPageDataCategories.id })
						);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('POST.databaseEntries.categories', cause),
						})
					),
				/**
				 * Inserts multiple permissions into the database.
				 *
				 * @param data - The data to insert into the permissions table.
				 * @returns A promise that resolves to the inserted permissions.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the permissions.
				 */
				permissions: (data: tsPermissionsInsert[]) =>
					Effect.gen(function* () {
						const currentPermittedUsers = yield* dbService.execute((db) =>
							db.select().from(tsPermissions)
						);

						for (const permission of data) {
							const userAlreadyExists = currentPermittedUsers.find(
								(user) => user.user === permission.user
							);

							if (userAlreadyExists) {
								return yield* Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(
											`User with ID ${permission.user} already has a rank assigned. Please update the existing rank instead.`
										),
									})
								);
							}
						}

						return yield* dbService.execute((db) =>
							db
								.insert(tsPermissions)
								.values(
									data.map((permission) => {
										return {
											user: permission.user,
											rank: permission.rank,
										};
									})
								)
								.returning({ user: tsPermissions.user, rank: tsPermissions.rank })
						);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('POST.databaseEntries.permissions', cause),
						})
					),
				/**
				 * Inserts multiple pages into the database.
				 *
				 * @param pages - The data to insert into the page data and page content tables.
				 * @returns A promise that resolves to the inserted pages.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while inserting the pages.
				 */
				pages: (pages: MultiPageInsert) =>
					Effect.gen(function* () {
						for (const { pageData, pageContent } of pages) {
							yield* POST.databaseEntry.pages(pageData, pageContent);
						}
					}),
			},
			folder: (data: tsPageFolderInsert) =>
				Effect.gen(function* () {
					const newEntry = yield* POST.databaseEntry.folder(data);

					yield* CLEAR.folderList();
					yield* CLEAR.folderTree();

					yield* UPDATE.folderList;
					yield* UPDATE.folderTree;

					return newEntry;
				}),
			page: (data: {
				pageData: tsPageDataInsert;
				pageContent: CombinedInsertContent;
			}) =>
				Effect.gen(function* () {
					const status = yield* isCacheEnabled;

					if (!status) {
						const newPage = yield* POST.databaseEntry.pages(data.pageData, data.pageContent);

						const { data: toReturn } = yield* GET.page.byId(newPage.pageData[0].id);

						return pageDataReturn(toReturn);
					}

					const newPage = yield* POST.databaseEntry.pages(data.pageData, data.pageContent);

					const { data: toReturn } = yield* GET.page.byId(newPage.pageData[0].id);

					pages.set(toReturn.id, pageDataReturn(toReturn));
					yield* CLEAR.folderList();
					yield* CLEAR.folderTree();

					return pageDataReturn(toReturn);
				}).pipe(
					Effect.catchTags({
						UnknownException: (cause) => _ClearUnknownError('POST.page', cause),
					})
				),
		};

		const UPDATE = {
			/**
			 * Updates a page content in the database.
			 *
			 * @param data - The data to update in the page content table.
			 * @returns A promise that resolves to the updated page content.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the page content.
			 */
			pageContent: dbService.makeQuery((ex, data: tsPageContentSelect) =>
				ex((db) =>
					db.update(tsPageContent).set(data).where(eq(tsPageContent.id, data.id)).returning().get()
				).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('UPDATE.pageContent', cause),
					})
				)
			),
			/**
			 * Updates a tag in the database.
			 *
			 * @param data - The data to update in the page data tags table.
			 * @returns A promise that resolves to the updated tag.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the tag.
			 */
			tags: dbService.makeQuery((ex, data: tsPageDataTagsSelect) =>
				ex((db) =>
					db
						.update(tsPageDataTags)
						.set(data)
						.where(eq(tsPageDataTags.id, data.id))
						.returning()
						.get()
				).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('UPDATE.tags', cause),
					})
				)
			),
			/**
			 * Updates a category in the database.
			 *
			 * @param data - The data to update in the page data categories table.
			 * @returns A promise that resolves to the updated category.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the category.
			 */
			categories: dbService.makeQuery((ex, data: tsPageDataCategoriesSelect) =>
				ex((db) =>
					db
						.update(tsPageDataCategories)
						.set(data)
						.where(eq(tsPageDataCategories.id, data.id))
						.returning()
						.get()
				).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('UPDATE.categories', cause),
					})
				)
			),
			/**
			 * Updates a permission in the database.
			 *
			 * @param data - The data to update in the permissions table.
			 * @returns A promise that resolves to the updated permission.
			 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the permission.
			 */
			permissions: dbService.makeQuery((ex, data: tsPermissionsSelect) =>
				ex((db) =>
					db
						.update(tsPermissions)
						.set(data)
						.where(eq(tsPermissions.user, data.user))
						.returning()
						.get()
				).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('UPDATE.permissions', cause),
					})
				)
			),
			folderTree: Effect.gen(function* () {
				const status = yield* isCacheEnabled;
				yield* CLEAR.folderTree();
				const newFolderTree = yield* buildFolderTree;
				if (status) {
					folderTree.set(FolderTreeMapID, folderTreeReturn(newFolderTree));
				}
			}).pipe(
				Effect.catchTags({
					'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
						_clearLibSQLError('UPDATE.folderTree', cause),
				})
			),
			folderList: Effect.gen(function* () {
				const status = yield* isCacheEnabled;
				yield* CLEAR.folderList();
				const folderList = yield* getAvailableFolders;
				if (status) {
					FolderList.set(FolderListMapID, folderListReturn(folderList));
				}
			}).pipe(
				Effect.catchTags({
					'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
						_clearLibSQLError('UPDATE.folderList', cause),
				})
			),
			folder: (data: tsPageFolderSelect) =>
				Effect.gen(function* () {
					const updated = yield* dbService.execute((db) =>
						db
							.update(tsPageFolderStructure)
							.set(data)
							.where(eq(tsPageFolderStructure.id, data.id))
							.returning()
							.get()
					);

					yield* UPDATE.folderList;
					yield* UPDATE.folderTree;

					return updated;
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('UPDATE.folder', cause),
					})
				),
			latestVersion: () =>
				Effect.gen(function* () {
					const status = yield* isCacheEnabled;
					const latestVersion = yield* getVersionFromNPM.get(StudioCMSPkgId);

					const newVersion = versionReturn(latestVersion);

					if (!status) return newVersion;

					version.set(VersionMapID, newVersion);

					return newVersion;
				}).pipe(
					Effect.catchTags({
						UnknownException: (cause) => _ClearUnknownError('UPDATE.latestVersion', cause),
					})
				),
			siteConfig: (data: SiteConfig) =>
				Effect.gen(function* () {
					const status = yield* isCacheEnabled;
					const newSiteConfig = yield* dbService.execute((db) =>
						db
							.update(tsSiteConfig)
							.set(data)
							.where(eq(tsSiteConfig.id, CMSSiteConfigId))
							.returning()
							.get()
					);

					const returnConfig = siteConfigReturn(newSiteConfig);

					if (!status) return returnConfig;

					siteConfig.set(SiteConfigMapID, returnConfig);

					return returnConfig;
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_clearLibSQLError('UPDATE.siteConfig', cause),
						UnknownException: (cause) => _ClearUnknownError('UPDATE.siteConfig', cause),
					})
				),
			page: {
				byId: (
					id: string,
					data: {
						pageData: tsPageDataSelect;
						pageContent: tsPageContentSelect;
					}
				) => {
					const updatePage = dbService.makeQuery((ex, data: tsPageDataSelect) =>
						ex((db) =>
							db.update(tsPageData).set(data).where(eq(tsPageData.id, data.id)).returning().get()
						)
					);

					return Effect.gen(function* () {
						const status = yield* isCacheEnabled;

						yield* updatePage(data.pageData);
						yield* UPDATE.pageContent(data.pageContent);

						const { data: updatedData } = yield* GET.page.byId(id);
						const returnData = pageDataReturn(updatedData);

						if (!status) {
							return returnData;
						}

						pages.set(id, returnData);
						yield* CLEAR.folderList();
						yield* CLEAR.folderTree();

						return returnData;
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('UPDATE.page.byId', cause),
							UnknownException: (cause) => _ClearUnknownError('UPDATE.page.byId', cause),
						})
					);
				},
				bySlug: (
					slug: string,
					data: {
						pageData: tsPageDataSelect;
						pageContent: tsPageContentSelect;
					}
				) => {
					const updatePage = dbService.makeQuery((ex, data: tsPageDataSelect) =>
						ex((db) =>
							db.update(tsPageData).set(data).where(eq(tsPageData.id, data.id)).returning().get()
						)
					);

					return Effect.gen(function* () {
						const status = yield* isCacheEnabled;

						if (!status) {
							yield* updatePage(data.pageData);
							yield* UPDATE.pageContent(data.pageContent);

							const { data: updatedData } = yield* GET.page.bySlug(slug);

							return pageDataReturn(updatedData);
						}

						const cachedPage = Array.from(pages.values()).find((page) => page.data.slug === slug);

						if (!cachedPage) {
							return yield* Effect.fail(
								yield* new SDKCoreError({
									type: 'UNKNOWN',
									cause: new StudioCMS_SDK_Error('Page not found in cache'),
								})
							);
						}

						yield* updatePage(data.pageData);
						yield* UPDATE.pageContent(data.pageContent);

						const { data: updatedData } = yield* GET.page.bySlug(slug);

						const returnData = pageDataReturn(updatedData);

						pages.set(updatedData.id, returnData);

						yield* CLEAR.folderList();
						yield* CLEAR.folderTree();

						return returnData;
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								_clearLibSQLError('UPDATE.page.byId', cause),
							UnknownException: (cause) => _ClearUnknownError('UPDATE.page.byId', cause),
						})
					);
				},
			},
		};

		return {
			db,
			dbService,
			getFullPath,
			findNodeByPath,
			findNodesAlongPath,
			findNodesAlongPathToId,
			findNodeById,
			addPageToFolderTree,
			generateRandomIDNumber,
			generateRandomPassword,
			generateToken,
			testToken,
			parseIdNumberArray,
			parseIdStringArray,
			combineRanks,
			verifyRank,
			buildFolderTree,
			getAvailableFolders,
			clearUserReferences,
			collectCategories,
			collectTags,
			collectPageData,
			collectUserData,
			resetTokenBucket,
			diffTracking,
			notificationSettings,
			CLEAR,
			DELETE,
			INIT,
			AUTH,
			REST_API,
			GET,
			POST,
			UPDATE,
		};
	}),
	dependencies: [
		AstroDB.Default,
		SDKCore_FolderTree.Default,
		SDKCore_Generators.Default,
		SDKCore_Parsers.Default,
		SDKCore_Users.Default,
		SDKCore_Collectors.Default,
		GetVersionFromNPM.Default,
	],
	accessors: true,
}) {
	static Provide = Effect.provide(this.Default);
}

/**
 * Test Effect for testing how SDKCore is shaped
 */
// const testProgram = Effect.gen(function* () {
// 	const sdkC = yield* SDKCore;
// 	return sdkC;
// }).pipe(Effect.provide(SDKCore.Default));

// const program = await Effect.runPromise(testProgram);
