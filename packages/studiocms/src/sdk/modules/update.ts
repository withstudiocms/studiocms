import { eq } from 'astro:db';
import { CMSSiteConfigId } from '../../consts.js';
import { Effect, genLogger } from '../../effect.js';
import {
	FolderListMapID,
	FolderTreeMapID,
	SiteConfigMapID,
	StudioCMSPkgId,
	VersionMapID,
} from '../consts.js';
import { AstroDB, GetVersionFromNPM, SDKCore_FolderTree } from '../effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import {
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPageFolderStructure,
	tsPermissions,
	tsSiteConfig,
} from '../tables.js';
import type {
	SiteConfig,
	tsPageContentSelect,
	tsPageDataCategoriesSelect,
	tsPageDataSelect,
	tsPageDataTagsSelect,
	tsPageFolderSelect,
	tsPermissionsSelect,
} from '../types/index.js';
import {
	CacheContext,
	_ClearUnknownError,
	_clearLibSQLError,
	folderListReturn,
	folderTreeReturn,
	isCacheEnabled,
	pageDataReturn,
	siteConfigReturn,
	versionReturn,
} from '../utils.js';
import { SDKCore_CLEAR } from './clear.js';
import { SDKCore_GET } from './get.js';

/**
 * Provides update operations for StudioCMS entities such as pages, tags, categories, permissions, folders, versions, and site configuration.
 *
 * @remarks
 * This service is part of the StudioCMS SDK core and is responsible for updating various resources in the database and cache.
 * It handles error catching for database operations and ensures cache consistency after updates.
 *
 * @example
 * ```typescript
 * const updateService = yield* SDKCore_UPDATE;
 * yield* updateService.pageContent({ id: '...', ... });
 * ```
 *
 * @class SDKCore_UPDATE
 * @extends Effect.Service
 *
 * @property pageContent - Updates a page's content in the database.
 * @property tags - Updates a tag in the database.
 * @property categories - Updates a category in the database.
 * @property permissions - Updates a permission in the database.
 * @property folderTree - Updates the folder tree structure and cache.
 * @property folderList - Updates the folder list and cache.
 * @property folder - Updates a folder and refreshes related caches.
 * @property latestVersion - Updates and caches the latest StudioCMS version.
 * @property siteConfig - Updates the site configuration and cache.
 * @property page.byId - Updates a page by its ID, including content and data, and refreshes caches.
 * @property page.bySlug - Updates a page by its slug, including content and data, and refreshes caches.
 *
 * @throws StudioCMS_SDK_Error - If an error occurs during any update operation.
 */
export class SDKCore_UPDATE extends Effect.Service<SDKCore_UPDATE>()(
	'studiocms/sdk/SDKCore/modules/update',
	{
		dependencies: [
			AstroDB.Default,
			SDKCore_CLEAR.Default,
			SDKCore_FolderTree.Default,
			SDKCore_GET.Default,
			GetVersionFromNPM.Default,
		],
		effect: genLogger('studiocms/sdk/SDKCore/modules/update/effect')(function* () {
			const [
				dbService,
				CLEAR,
				GET,
				{ buildFolderTree, getAvailableFolders },
				{ pages, FolderList, folderTree, version, siteConfig },
				getVersionFromNPM,
			] = yield* Effect.all([
				AstroDB,
				SDKCore_CLEAR,
				SDKCore_GET,
				SDKCore_FolderTree,
				CacheContext,
				GetVersionFromNPM,
			]);

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
						db
							.update(tsPageContent)
							.set(data)
							.where(eq(tsPageContent.id, data.id))
							.returning()
							.get()
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

							yield* CLEAR.folderList();
							yield* CLEAR.folderTree();
							yield* CLEAR.pages();

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
									new SDKCoreError({
										type: 'UNKNOWN',
										cause: new StudioCMS_SDK_Error('Page not found in cache'),
									})
								);
							}

							yield* updatePage(data.pageData);
							yield* UPDATE.pageContent(data.pageContent);

							const { data: updatedData } = yield* GET.page.bySlug(slug);

							const returnData = pageDataReturn(updatedData);

							yield* CLEAR.folderList();
							yield* CLEAR.folderTree();
							yield* CLEAR.pages();

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

			return UPDATE;
		}),
	}
) {}
