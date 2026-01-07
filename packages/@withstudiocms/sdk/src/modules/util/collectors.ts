import { Data, Effect, type ParseResult, Schema } from '@withstudiocms/effect';
import type { DBCallbackFailure } from '@withstudiocms/kysely';
import type { DatabaseError } from '@withstudiocms/kysely/core/errors';
import { DBClientLive, StorageManagerResolver } from '../../context.js';
import { resolveStorageManagerUrls } from '../../lib/storage-manager.js';
import {
	StudioCMSOAuthAccounts,
	StudioCMSPageContent,
	StudioCMSPageDataCategories,
	StudioCMSPageDataTags,
	StudioCMSPermissions,
	StudioCMSUsersTable,
} from '../../tables.js';
import type {
	CombinedPageData,
	CombinedUserData,
	FolderNode,
	MetaOnlyPageData,
	PageDataReturnType,
	tsPageDataSelect,
	tsUsersSelect,
} from '../../types.js';
import { type FolderTreeError, SDKFolderTree } from './folderTree.js';
import { SDKParsers } from './parsers.js';
import { slugify } from './slugify.js';

/**
 * Error class for collector errors.
 */
export class CollectorError extends Data.TaggedError('CollectorError')<{ cause: unknown }> {}

/**
 * Utility function to handle errors in collector functions.
 *
 * @param _try - The function to execute that may throw an error.
 * @returns An effect that either yields the result of the function or a CollectorError.
 */
export const useCollectorError = <T>(_try: () => T) =>
	Effect.try({
		try: _try,
		catch: (error) => new CollectorError({ cause: error }),
	});

/**
 * SDKCollectors
 *
 * Effect generator that wires together database access, folder-tree utilities, and parsing helpers
 * to produce a set of high-level "collector" utilities for assembling richer SDK models from
 * raw database rows.
 *
 * Behavior
 * - Instantiates required dependencies (DB client, folder-tree helpers, parsers) by yielding the
 *   corresponding live implementations.
 * - Exposes a small collection of helper effects and functions that perform typed queries,
 *   transform results, and compose several queries into complete domain objects.
 *
 * Internal helpers (provided inside the effect)
 * - _getUserData(id: string): Effect that queries StudioCMSUsersTable and decodes the result.
 * - _getPageContent(id: string): Effect that queries StudioCMSPageContent for multi-language page
 *   content and decodes the result.
 * - _getOAuthAccountData(id: string): Effect that queries StudioCMSOAuthAccounts for a user's
 *   OAuth accounts and decodes the result.
 * - _getUserPermissionsData(id: string): Effect that queries StudioCMSPermissions for a user's
 *   permissions and decodes the result.
 *
 * Utility functions
 * - _transformPageDataToMetaOnly:
 *     Transforms a CombinedPageData (or array thereof) into its metadata-only representation by
 *     stripping large content fields (defaultContent, multiLangContent). Returns an Effect that
 *     fails with a CollectorError when transformation fails.
 * - _collectContributorData(ids: readonly string[]):
 *     Concurrently fetches user records for a list of contributor IDs and filters out missing
 *     results.
 *
 * Main collectors (returned object)
 * - collectCategories(ids: number[]):
 *     Uses a codec-backed query to fetch category rows by id.
 * - collectTags(ids: number[]):
 *     Uses a codec-backed query to fetch tag rows by id.
 * - collectPageData(page, tree, metaOnly = false):
 *     Assembles a complete page model by concurrently collecting:
 *       - categories and tags (via parsers -> collectCategories/collectTags),
 *       - contributor user data,
 *       - author user data,
 *       - multi-language page content (when metaOnly is false).
 *     It computes a safe slug (special-casing "index" -> "/") and resolves the full URL
 *     route by walking the provided folder tree (using findNodesAlongPathToId) when a
 *     parentFolder is present.
 *     Overloads:
 *       - Without metaOnly (or metaOnly === false) returns CombinedPageData.
 *       - With metaOnly === true returns MetaOnlyPageData (content stripped via
 *         _transformPageDataToMetaOnly).
 *     Possible failure modes include DatabaseError, ParseResult.ParseError, FolderTreeError,
 *     and CollectorError.
 * - collectUserData(user):
 *     Enriches a user row with its OAuth accounts and permissions and returns a CombinedUserData
 *     result.
 *
 * Errors
 * - All operations are represented as Effects and may fail with the module's domain errors such
 *   as DatabaseError, ParseResult.ParseError, FolderTreeError, and CollectorError.
 *
 * Usage
 * - The effect yields an object with the above collector functions which can be used by other
 *   SDK modules to obtain normalized, assembled data for pages, users, tags, and categories.
 */
export const SDKCollectors = Effect.gen(function* () {
	const [
		{ withCodec },
		{ findNodesAlongPathToId },
		{ parseIdNumberArray, parseIdStringArray },
		smResolver,
	] = yield* Effect.all([DBClientLive, SDKFolderTree, SDKParsers, StorageManagerResolver]);

	const resolveUrls = resolveStorageManagerUrls(smResolver);

	// =================================================
	// Database query helpers
	// =================================================

	/**
	 * Internal helper to get user data by ID.
	 *
	 * @param id - The user ID.
	 * @returns The user data.
	 */
	const _getUserData = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSUsersTable.Select),
		callbackFn: (query, id) =>
			query((db) =>
				db.selectFrom('StudioCMSUsersTable').selectAll().where('id', '=', id).executeTakeFirst()
			),
	});

	/**
	 * Internal helper to get page content by page ID.
	 *
	 * @param id - The page ID.
	 * @returns The page content data.
	 */
	const _getPageContent = withCodec({
		encoder: Schema.String,
		decoder: Schema.Array(StudioCMSPageContent.Select),
		callbackFn: (query, id) =>
			query((db) =>
				db.selectFrom('StudioCMSPageContent').selectAll().where('contentId', '=', id).execute()
			),
	});

	/**
	 * Internal helper to get OAuth account data by user ID.
	 *
	 * @param id - The user ID.
	 * @returns The OAuth account data.
	 */
	const _getOAuthAccountData = withCodec({
		encoder: Schema.String,
		decoder: Schema.Array(StudioCMSOAuthAccounts.Select),
		callbackFn: (query, id) =>
			query((db) =>
				db.selectFrom('StudioCMSOAuthAccounts').selectAll().where('userId', '=', id).execute()
			),
	});

	/**
	 * Internal helper to get user permissions data by user ID.
	 *
	 * @param id - The user ID.
	 * @returns The user permissions data.
	 */
	const _getUserPermissionsData = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSPermissions.Select),
		callbackFn: (query, id) =>
			query((db) =>
				db.selectFrom('StudioCMSPermissions').selectAll().where('user', '=', id).executeTakeFirst()
			),
	});

	// =================================================
	// Utility functions
	// =================================================

	/**
	 * Transforms the collected page data to include only metadata.
	 *
	 * @param data - The page data to transform.
	 * @returns A promise that resolves to the transformed page data.
	 * @throws {UnknownException} If an error occurs during transformation.
	 */
	const _transformPageDataToMetaOnly = <T extends CombinedPageData[] | CombinedPageData>(
		data: T
	): Effect.Effect<PageDataReturnType<T>, CollectorError, never> =>
		useCollectorError(() => {
			if (Array.isArray(data)) {
				return data.map(
					({ defaultContent, multiLangContent, ...rest }) => rest
				) as PageDataReturnType<T>;
			}
			const {
				defaultContent: _dump1,
				multiLangContent: _dump2,
				...rest
			} = data as CombinedPageData;
			return rest as PageDataReturnType<T>;
		});

	/**
	 * Internal helper to collect contributor data by their IDs.
	 *
	 * @param ids - An array of contributor IDs.
	 * @returns An effect that yields an array of contributor user data.
	 */
	const _collectContributorData = Effect.fn((ids: readonly string[]) =>
		Effect.all(ids.map((id) => _getUserData(id))).pipe(
			Effect.map((results) => results.filter((user): user is NonNullable<typeof user> => !!user))
		)
	);

	// =================================================
	// Main collectors
	// =================================================

	/**
	 * Collect categories by their IDs.
	 *
	 * @param categoryIds - Array of category IDs to collect.
	 * @returns Collected categories.
	 */
	const collectCategories = withCodec({
		encoder: Schema.Array(Schema.Number),
		decoder: Schema.Array(StudioCMSPageDataCategories.Select),
		callbackFn: (db, ids) =>
			db((c) =>
				c.selectFrom('StudioCMSPageDataCategories').selectAll().where('id', 'in', ids).execute()
			),
	});

	/**
	 * Collect tags by their IDs.
	 *
	 * @param tagIds - Array of tag IDs to collect.
	 * @returns Collected tags.
	 */
	const collectTags = withCodec({
		encoder: Schema.Array(Schema.Number),
		decoder: Schema.Array(StudioCMSPageDataTags.Select),
		callbackFn: (db, ids) =>
			db((c) => c.selectFrom('StudioCMSPageDataTags').selectAll().where('id', 'in', ids).execute()),
	});

	function collectPageData(
		page: tsPageDataSelect,
		tree: FolderNode[]
	): Effect.Effect<
		CombinedPageData,
		CollectorError | FolderTreeError | DBCallbackFailure | DatabaseError | ParseResult.ParseError,
		never
	>;
	function collectPageData(
		page: tsPageDataSelect,
		tree: FolderNode[],
		metaOnly: boolean
	): Effect.Effect<
		MetaOnlyPageData,
		CollectorError | FolderTreeError | DBCallbackFailure | DatabaseError | ParseResult.ParseError,
		never
	>;

	/**
	 * Collects and assembles comprehensive page data including categories, tags, contributors, and URL route.
	 *
	 * @param page - The page data selection object.
	 * @param tree - The folder tree structure.
	 * @param metaOnly - Flag indicating whether to return only metadata.
	 * @returns An effect that yields the assembled page data or a CollectorError.
	 */
	function collectPageData(page: tsPageDataSelect, tree: FolderNode[], metaOnly = false) {
		return Effect.gen(function* () {
			const [categories, tags, contributorsData, authorData] = yield* Effect.all([
				parseIdNumberArray(page.categories || []).pipe(Effect.flatMap(collectCategories)),
				parseIdNumberArray(page.tags || []).pipe(Effect.flatMap(collectTags)),
				parseIdStringArray(page.contributorIds || []).pipe(Effect.flatMap(_collectContributorData)),
				_getUserData(page.authorId),
			]);

			let multiLangContent: readonly (typeof StudioCMSPageContent)['Select']['Type'][] = [];
			if (!metaOnly) {
				multiLangContent = yield* _getPageContent(page.id);
			}

			const defaultContent = multiLangContent?.find(
				(content) => content.contentLang === page.contentLang
			);

			const safeSlug = page.slug === 'index' ? '/' : slugify(page.slug);

			let urlRoute = safeSlug.startsWith('/') ? safeSlug : `/${safeSlug}`;

			if (page.parentFolder) {
				const urlParts = yield* findNodesAlongPathToId(tree, page.parentFolder);
				const folderPath = urlParts.map(({ name }) => slugify(name)).join('/');
				urlRoute =
					folderPath.length > 0
						? `/${folderPath}${safeSlug === '/' ? '' : `/${safeSlug}`}`
						: safeSlug;
			}

			let authorDataTyped: Omit<tsUsersSelect, 'email' | 'password'> | undefined;

			if (authorData) {
				const { email, password, ...rest } = authorData;
				// Exclude sensitive fields
				authorDataTyped = {
					...rest,
				};
			}

			let contributorsDataTyped: Omit<tsUsersSelect, 'email' | 'password'>[] | undefined;

			if (contributorsData) {
				contributorsDataTyped = contributorsData.map(({ email, password, ...rest }) => ({
					...rest,
				}));
			}

			const returnData = yield* resolveUrls(
				{
					...page,
					slug: safeSlug,
					urlRoute,
					categories,
					tags,
					authorData: authorDataTyped,
					contributorsData: contributorsDataTyped,
					multiLangContent,
					defaultContent,
				} as CombinedPageData,
				['heroImage']
			).pipe(Effect.catchTag('UnknownException', (e) => new CollectorError({ cause: e })));

			if (!returnData) {
				return yield* Effect.fail(
					new CollectorError({
						cause: 'Unknown error occurred while resolving storage manager URL',
					})
				);
			}

			if (metaOnly) {
				return yield* _transformPageDataToMetaOnly(returnData);
			}

			return returnData;
		});
	}

	/**
	 * Collects and assembles comprehensive user data including OAuth accounts and permissions.
	 *
	 * @param user - The user data selection object.
	 * @returns An effect that yields the assembled user data or a CollectorError.
	 */
	const collectUserData = Effect.fn((user: tsUsersSelect) =>
		Effect.all([_getOAuthAccountData(user.id), _getUserPermissionsData(user.id)]).pipe(
			Effect.map(
				([oAuthData, permissionsData]) =>
					({
						...user,
						oAuthData,
						permissionsData,
					}) as CombinedUserData
			)
		)
	);

	return {
		collectCategories,
		collectTags,
		collectPageData,
		collectUserData,
	};
});
