import { asc, desc, eq, inArray } from 'astro:db';
import { createTwoFilesPatch } from 'diff';
import { type Diff2HtmlConfig, html } from 'diff2html';
import { Effect } from 'effect';
import type { UnknownException } from 'effect/Cause';
import {
	CMSNotificationSettingsId,
	GhostUserDefaults,
	NotificationSettingsDefaults,
} from '../consts.js';
import type { LibSQLDatabaseError } from './effect/db.js';
import {
	AstroDB,
	SDKCore_FolderTree,
	SDKCore_Generators,
	SDKCore_Parsers,
	SDKCore_Users,
} from './effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from './errors.js';
import {
	tsDiffTracking,
	tsNotificationSettings,
	tsOAuthAccounts,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPageFolderStructure,
	tsPermissions,
	tsSessionTable,
	tsUserResetTokens,
	tsUsers,
} from './tables.js';
import type {
	CombinedPageData,
	CombinedUserData,
	FolderListItem,
	FolderNode,
	MetaOnlyPageData,
	PageDataReturnType,
	tsNotificationSettingsInsert,
	tsPageDataSelect,
	tsUserResetTokensSelect,
	tsUsersSelect,
} from './types/index.js';

export class SDKCore extends Effect.Service<SDKCore>()('studiocms/sdk/SDKCore', {
	effect: Effect.gen(function* () {
		// Get Services
		const dbService = yield* AstroDB;
		const folderTreeService = yield* SDKCore_FolderTree;
		const generatorService = yield* SDKCore_Generators;
		const parseService = yield* SDKCore_Parsers;
		const userService = yield* SDKCore_Users;

		// Breakout service functions that need to be returned in this.
		const { db } = dbService;

		const {
			getFullPath,
			findNodeByPath,
			findNodesAlongPath,
			findNodesAlongPathToId,
			findNodeById,
			addPageToFolderTree,
		} = folderTreeService;

		const { generateRandomIDNumber, generateRandomPassword, generateToken, testToken } =
			generatorService;

		const { parseIdNumberArray, parseIdStringArray } = parseService;

		const { combineRanks, verifyRank } = userService;

		/**
		 * Gets the folder structure from the database.
		 *
		 * @returns A promise that resolves to an array of folder nodes representing the folder structure.
		 */
		const buildFolderTree: Effect.Effect<FolderNode[], LibSQLDatabaseError | SDKCoreError, never> =
			Effect.gen(function* () {
				const currentFolders = yield* dbService.execute((db) =>
					db.select().from(tsPageFolderStructure)
				);
				return yield* folderTreeService.generateFolderTree(currentFolders);
			});

		/**
		 * Gets the available folders from the database.
		 *
		 * @returns A promise that resolves to an array of folder list items.
		 */
		const getAvailableFolders: Effect.Effect<FolderListItem[], LibSQLDatabaseError, never> =
			Effect.gen(function* () {
				const folders: FolderListItem[] = [];

				const currentFolders = yield* dbService.execute((db) =>
					db.select().from(tsPageFolderStructure)
				);

				for (const current of currentFolders) {
					folders.push(current);
				}
				return folders;
			});

		/**
		 * Clears all references to a specific user from various database tables.
		 *
		 * This function performs the following operations within a database transaction:
		 * - Deletes user reset tokens associated with the given user ID.
		 * - Deletes permissions associated with the given user ID.
		 * - Deletes OAuth accounts associated with the given user ID.
		 * - Deletes session records associated with the given user ID.
		 * - Updates the `tsDiffTracking` table to replace the user's ID with a default "ghost user" ID.
		 * - Updates the `tsPageData` table to replace the author's ID with a default "ghost user" ID.
		 *
		 * If any database operation fails, the transaction is rolled back, and an error is returned.
		 *
		 * @param userId - The ID of the user whose references should be cleared.
		 * @returns An `Effect` that resolves to `true` if the operation succeeds, or fails with an `SDKCoreError` if an error occurs.
		 *
		 * @throws SDKCoreError - If a database error occurs during the operation.
		 */
		const clearUserReferences = (userId: string): Effect.Effect<boolean, SDKCoreError, never> =>
			dbService
				.transaction((tx) =>
					Effect.gen(function* () {
						yield* tx((c) =>
							c.delete(tsUserResetTokens).where(eq(tsUserResetTokens.userId, userId))
						);
						yield* tx((c) => c.delete(tsPermissions).where(eq(tsPermissions.user, userId)));
						yield* tx((c) => c.delete(tsOAuthAccounts).where(eq(tsOAuthAccounts.userId, userId)));
						yield* tx((c) => c.delete(tsSessionTable).where(eq(tsSessionTable.userId, userId)));
						yield* tx((c) =>
							c
								.update(tsDiffTracking)
								.set({ userId: GhostUserDefaults.id })
								.where(eq(tsDiffTracking.userId, userId))
						);
						yield* tx((c) =>
							c
								.update(tsPageData)
								.set({ authorId: GhostUserDefaults.id })
								.where(eq(tsPageData.authorId, userId))
						);

						return true;
					})
				)
				.pipe(
					Effect.catchTags({
						'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
							Effect.fail(
								new SDKCoreError({
									type: 'LibSQLDatabaseError',
									cause: new StudioCMS_SDK_Error(`Error clearing user references: ${cause}`),
								})
							),
					})
				);

		/**
		 * Collects categories based on the provided category IDs.
		 *
		 * @param categoryIds - An array of category IDs to collect.
		 * @returns A promise that resolves to an array of collected categories.
		 * @throws {StudioCMS_SDK_Error} If there is an error while collecting categories.
		 */
		const collectCategories = (
			categoryIds: number[]
		): Effect.Effect<CombinedPageData['categories'], SDKCoreError, never> =>
			Effect.gen(function* () {
				const categories: CombinedPageData['categories'] = [];

				if (categoryIds.length > 0) {
					yield* dbService.transaction((tx) =>
						Effect.gen(function* () {
							for (const item of categoryIds) {
								const resItem = yield* tx((c) =>
									c
										.select()
										.from(tsPageDataCategories)
										.where(eq(tsPageDataCategories.id, item))
										.get()
								);

								if (resItem) categories.push(resItem);
							}
						})
					);
				}

				return categories as CombinedPageData['categories'];
			}).pipe(
				Effect.catchTags({
					'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
						Effect.fail(
							new SDKCoreError({
								type: 'LibSQLDatabaseError',
								cause: new StudioCMS_SDK_Error(`Error getting categories: ${cause}`),
							})
						),
				})
			);

		/**
		 * Collects tags based on the provided tag IDs.
		 *
		 * @param tagIds - An array of tag IDs to collect.
		 * @returns A promise that resolves to an array of tags.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while fetching the tags.
		 */
		const collectTags = (
			tagIds: number[]
		): Effect.Effect<CombinedPageData['tags'], SDKCoreError, never> =>
			Effect.gen(function* () {
				const tags: CombinedPageData['tags'] = [];

				if (tagIds.length > 0) {
					yield* dbService.transaction((tx) =>
						Effect.gen(function* () {
							for (const item of tagIds) {
								const resItem = yield* tx((c) =>
									c.select().from(tsPageDataTags).where(eq(tsPageDataTags.id, item)).get()
								);

								if (resItem) tags.push(resItem);
							}
						})
					);
				}

				return tags as CombinedPageData['tags'];
			}).pipe(
				Effect.catchTags({
					'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
						Effect.fail(
							new SDKCoreError({
								type: 'LibSQLDatabaseError',
								cause: new StudioCMS_SDK_Error(`Error getting tags: ${cause}`),
							})
						),
				})
			);

		const transformPageDataToMetaOnly = <T extends CombinedPageData[] | CombinedPageData>(
			data: T
		): Effect.Effect<PageDataReturnType<T>, UnknownException, never> =>
			Effect.try(() => {
				if (Array.isArray(data)) {
					return data.map(
						({ defaultContent, multiLangContent, ...rest }) => rest
					) as PageDataReturnType<T>;
				}
				const { defaultContent, multiLangContent, ...rest } = data as CombinedPageData;
				return rest as PageDataReturnType<T>;
			});

		/**
		 * Collects and combines various data related to a page.
		 *
		 * @param page - The page data to collect additional information for.
		 * @param tree - The FolderNode tree
		 * @param metaOnly - Only return the metadata and not the pageContent
		 * @returns A promise that resolves to the combined page data.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while collecting page data.
		 */
		const collectPageData = (
			page: tsPageDataSelect,
			tree: FolderNode[],
			metaOnly = false
		): Effect.Effect<MetaOnlyPageData | CombinedPageData, SDKCoreError, never> =>
			Effect.gen(function* () {
				const categoryIds = yield* parseIdNumberArray(page.categories || []);
				const tagIds = yield* parseIdNumberArray(page.tags || []);
				const contributorIds = yield* parseIdStringArray(page.contributorIds || []);

				const categories = yield* collectCategories(categoryIds);
				const tags = yield* collectTags(tagIds);

				const authorData = yield* dbService.execute((db) =>
					db
						.select()
						.from(tsUsers)
						.where(eq(tsUsers.id, page.authorId || ''))
						.get()
				);

				const contributorsData = yield* dbService.execute((db) =>
					db.select().from(tsUsers).where(inArray(tsUsers.id, contributorIds))
				);

				let multiLanguageContentData:
					| {
							id: string;
							contentLang: string;
							contentId: string;
							content: string | null;
					  }[]
					| undefined = undefined;

				if (!metaOnly) {
					multiLanguageContentData = yield* dbService.execute((db) =>
						db.select().from(tsPageContent).where(eq(tsPageContent.contentId, page.id))
					);
				}

				const defaultLanguageContentData = multiLanguageContentData?.find(
					(content) => content.contentLang === page.contentLang
				);

				const safeSlug = page.slug === 'index' ? '/' : `/${page.slug}`;

				let urlRoute = safeSlug;

				if (page.parentFolder) {
					const urlParts = yield* findNodesAlongPathToId(tree, page.parentFolder);
					urlRoute = urlParts.map((part) => part.name).join('/') + safeSlug;
				}

				const returnData = {
					...page,
					urlRoute,
					categories,
					tags,
					contributorIds,
					authorData,
					contributorsData,
					multiLangContent: multiLanguageContentData,
					defaultContent: defaultLanguageContentData,
				} as CombinedPageData;

				if (metaOnly) {
					return yield* transformPageDataToMetaOnly(returnData);
				}

				return returnData;
			}).pipe(
				Effect.catchTags({
					'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
						Effect.fail(
							new SDKCoreError({
								type: 'LibSQLDatabaseError',
								cause: new StudioCMS_SDK_Error(`Error collecting page data: ${cause}`),
							})
						),
					UnknownException: (cause) =>
						Effect.fail(
							new SDKCoreError({
								type: 'UNKNOWN',
								cause: new StudioCMS_SDK_Error(`Error collecting page data: ${cause}`),
							})
						),
				})
			);

		/**
		 * Collects user data by fetching OAuth data and permission data from the database.
		 *
		 * @param user - The user object containing user information.
		 * @returns A promise that resolves to a CombinedUserData object containing the user data, OAuth data, and permissions data.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while collecting user data.
		 */
		const collectUserData = (
			user: tsUsersSelect
		): Effect.Effect<CombinedUserData, SDKCoreError, never> =>
			Effect.gen(function* () {
				const oAuthData = yield* dbService.execute((db) =>
					db.select().from(tsOAuthAccounts).where(eq(tsOAuthAccounts.userId, user.id))
				);
				const permissionsData = yield* dbService.execute((db) =>
					db.select().from(tsPermissions).where(eq(tsPermissions.user, user.id)).get()
				);

				return {
					...user,
					oAuthData,
					permissionsData,
				} as CombinedUserData;
			}).pipe(
				Effect.catchTags({
					'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
						Effect.fail(
							new SDKCoreError({
								type: 'LibSQLDatabaseError',
								cause: new StudioCMS_SDK_Error(`Error collecting user data: ${cause}`),
							})
						),
				})
			);

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
		};
	}),
	dependencies: [
		AstroDB.Default,
		SDKCore_FolderTree.Default,
		SDKCore_Generators.Default,
		SDKCore_Parsers.Default,
		SDKCore_Users.Default,
	],
}) {}

/**
 * Test Effect for testing how SDKCore is shaped
 */
const testProgram = Effect.gen(function* () {
	const sdkC = yield* SDKCore;
}).pipe(Effect.provide(SDKCore.Default));
