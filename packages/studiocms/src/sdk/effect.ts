import { eq, inArray } from 'astro:db';
import type { ResultSet } from '@libsql/client';
import { Effect } from 'effect';
import type { UnknownException } from 'effect/Cause';
import { GhostUserDefaults } from '../consts.js';
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
	tsPageDataSelect,
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
			new: (
				userId: string
			): Effect.Effect<typeof tsUserResetTokens.$inferSelect, SDKCoreError, never> =>
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
			delete: (userId: string): Effect.Effect<ResultSet, SDKCoreError, never> =>
				dbService
					.execute((db) => db.delete(tsUserResetTokens).where(eq(tsUserResetTokens.userId, userId)))
					.pipe(
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
