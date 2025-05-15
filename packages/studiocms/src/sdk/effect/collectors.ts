import { eq, inArray } from 'astro:db';
import { Effect } from 'effect';
import type { UnknownException } from 'effect/Cause';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import {
	tsOAuthAccounts,
	tsPageContent,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
	tsUsers,
} from '../tables.js';
import type {
	CombinedPageData,
	CombinedUserData,
	FolderNode,
	MetaOnlyPageData,
	PageDataReturnType,
	tsPageDataSelect,
	tsUsersSelect,
} from '../types/index.js';
import { AstroDB } from './db.js';
import { SDKCore_FolderTree } from './foldertree.js';
import { SDKCore_Parsers } from './parsers.js';

export class SDKCore_Collectors extends Effect.Service<SDKCore_Collectors>()('SDKCore_Collectors', {
	effect: Effect.gen(function* () {
		const dbService = yield* AstroDB;
		const folderTreeService = yield* SDKCore_FolderTree;
		const parseService = yield* SDKCore_Parsers;

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
					const resItem = yield* dbService.execute((db) =>
						db
							.select()
							.from(tsPageDataCategories)
							.where(inArray(tsPageDataCategories.id, categoryIds))
					);

					if (resItem) categories.push(...resItem);
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
					const resItem = yield* dbService.execute((db) =>
						db.select().from(tsPageDataTags).where(inArray(tsPageDataTags.id, tagIds))
					);

					if (resItem) tags.push(...resItem);
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

		function collectPageData(
			page: tsPageDataSelect,
			tree: FolderNode[]
		): Effect.Effect<CombinedPageData, SDKCoreError, never>;
		function collectPageData(
			page: tsPageDataSelect,
			tree: FolderNode[],
			metaOnly: boolean
		): Effect.Effect<MetaOnlyPageData, SDKCoreError, never>;
		/**
		 * Collects and combines various data related to a page.
		 *
		 * @param page - The page data to collect additional information for.
		 * @param tree - The FolderNode tree
		 * @param metaOnly - Only return the metadata and not the pageContent
		 * @returns A promise that resolves to the combined page data.
		 * @throws {StudioCMS_SDK_Error} If an error occurs while collecting page data.
		 */
		function collectPageData(page: tsPageDataSelect, tree: FolderNode[], metaOnly = false) {
			return Effect.gen(function* () {
				const categoryIds = yield* parseService.parseIdNumberArray(page.categories || []);
				const tagIds = yield* parseService.parseIdNumberArray(page.tags || []);
				const contributorIds = yield* parseService.parseIdStringArray(page.contributorIds || []);

				const categories = yield* collectCategories(categoryIds);
				const tags = yield* collectTags(tagIds);

				const authorData = yield* dbService.execute((db) =>
					db
						.select()
						.from(tsUsers)
						.where(eq(tsUsers.id, page.authorId || ''))
						.get()
				);

				let contributorsData: tsUsersSelect[];

				if (contributorIds.length) {
					contributorsData = yield* dbService.execute((db) =>
						db.select().from(tsUsers).where(inArray(tsUsers.id, contributorIds))
					);
				} else {
					contributorsData = [];
				}

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
					const urlParts = yield* folderTreeService.findNodesAlongPathToId(tree, page.parentFolder);
					urlRoute = `/${urlParts.map((part) => part.name).join('/')}${safeSlug}`;
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
		}

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

		return { collectCategories, collectTags, collectPageData, collectUserData };
	}),
	dependencies: [AstroDB.Default, SDKCore_FolderTree.Default, SDKCore_Parsers.Default],
}) {}
