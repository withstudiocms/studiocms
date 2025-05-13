import { and, asc, desc, eq } from 'astro:db';
import { sdk as sdkConfig } from 'studiocms:config';
import { createTwoFilesPatch } from 'diff';
import { type Diff2HtmlConfig, html } from 'diff2html';
import { Effect } from 'effect';
import {
	CMSNotificationSettingsId,
	GhostUserDefaults,
	NotificationSettingsDefaults,
} from '../consts.js';
import {
	AstroDB,
	SDKCore_Collectors,
	SDKCore_FolderTree,
	SDKCore_Generators,
	SDKCore_Parsers,
	SDKCore_Users,
} from './effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from './errors.js';
import {
	tsDiffTracking,
	tsNotificationSettings,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPageFolderStructure,
	tsPermissions,
	tsUserResetTokens,
	tsUsers,
} from './tables.js';
import type {
	CombinedPageData,
	CombinedUserData,
	FolderListCacheObject,
	FolderNode,
	FolderTreeCacheObject,
	MetaOnlyPageData,
	PageDataCacheObject,
	SiteConfigCacheObject,
	VersionCacheObject,
	tsNotificationSettingsInsert,
	tsPageDataSelect,
	tsUserResetTokensSelect,
	tsUsersSelect,
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

const _ClearDeleteError = (id: string, cause: unknown) =>
	Effect.fail(
		new SDKCoreError({
			type: 'LibSQLDatabaseError',
			cause: new StudioCMS_SDK_Error(`${id} Error: ${cause}`),
		})
	);

export class SDKCore extends Effect.Service<SDKCore>()('studiocms/sdk/SDKCore', {
	effect: Effect.gen(function* () {
		// Get Services
		const dbService = yield* AstroDB;
		const folderTreeService = yield* SDKCore_FolderTree;
		const generatorService = yield* SDKCore_Generators;
		const parseService = yield* SDKCore_Parsers;
		const userService = yield* SDKCore_Users;
		const collectorService = yield* SDKCore_Collectors;

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

		const AUTH = {};

		const INIT = {};

		const REST_API = {};

		const GET = {};

		const POST = {};

		const UPDATE = {};

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
					yield* dbService.transaction((tx) =>
						Effect.gen(function* () {
							yield* tx((db) => db.delete(tsDiffTracking).where(eq(tsDiffTracking.pageId, id)));
							yield* tx((db) => db.delete(tsPageContent).where(eq(tsPageContent.contentId, id)));
							yield* tx((db) => db.delete(tsPageData).where(eq(tsPageData.id, id)));
						})
					);

					yield* CLEAR.pages();
					return {
						status: 'success',
						message: `Page with ID ${id} has been deleted successfully`,
					};
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_ClearDeleteError('DELETE.page', cause),
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
							_ClearDeleteError('DELETE.pageContent', cause),
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
							_ClearDeleteError('DELETE.pageContentLang', cause),
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
							_ClearDeleteError('DELETE.tags', cause),
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
							_ClearDeleteError('DELETE.categories', cause),
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
							_ClearDeleteError('DELETE.permissions', cause),
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
							_ClearDeleteError('DELETE.diffTracking', cause),
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

					// TODO: Setup update functions for folderList, and FolderTree
					// yield* UPDATE.FolderList();
					// yield* UPDATE.FolderTree();

					return {
						status: 'success',
						message: `Folder with ID ${id} has been deleted successfully`,
					};
				}).pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							_ClearDeleteError('DELETE.folder', cause),
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
						yield* _ClearDeleteError(
							'DELETE.user',
							`User with ID ${id} is an internal user and cannot be deleted.`
						);
						return void 0;
					}

					const verifyNoReference = yield* clearUserReferences(id);

					if (!verifyNoReference) {
						yield* _ClearDeleteError(
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
							_ClearDeleteError('DELETE.user', cause),
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
		};
	}),
	dependencies: [
		AstroDB.Default,
		SDKCore_FolderTree.Default,
		SDKCore_Generators.Default,
		SDKCore_Parsers.Default,
		SDKCore_Users.Default,
		SDKCore_Collectors.Default,
	],
}) {}

/**
 * Test Effect for testing how SDKCore is shaped
 */
const testProgram = Effect.gen(function* () {
	const sdkC = yield* SDKCore;
	return sdkC;
}).pipe(Effect.provide(SDKCore.Default));

// const program = await convertToVanilla(testProgram, true);
