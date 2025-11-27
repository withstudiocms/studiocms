import { Effect, type ParseResult, Schema } from '@withstudiocms/effect';
import {
	type DBCallbackFailure,
	StudioCMSPageData,
	StudioCMSPageFolderStructure,
	StudioCMSPermissions,
	StudioCMSUsersTable,
} from '@withstudiocms/kysely';
import type { DatabaseError } from '@withstudiocms/kysely/core/errors';
import CacheService from '../../cache.js';
import { cacheKeyGetters, cacheTags } from '../../consts.js';
import { DBClientLive, SDKDefaults } from '../../context.js';
import type {
	CombinedPageData,
	MetaOnlyPageData,
	PageDataReturnType,
	SingleRank,
	tsPageDataSelect,
	tsUsersSelect,
} from '../../types.js';
import SDKConfigModule from '../config/index.js';
import { type CollectorError, SDKCollectors } from '../util/collectors.js';
import { type FolderTreeError, SDKFolderTree } from '../util/folderTree.js';
import { GetFromNPM } from '../util/getFromNPM.js';
import { SDKUsers, type UsersError } from '../util/users.js';

/**
 * Ranks available in the system.
 */
const ranks = ['owner', 'admin', 'editor', 'visitor'] as const;

/**
 * Type representing the possible ranks.
 */
type Ranks = (typeof ranks)[number];

/**
 * Helper type for partial permission list.
 *
 * @remarks
 * This type maps each rank to a function that returns an Effect yielding an array of SingleRank objects.
 */
type PartialPermissionList = Record<
	`${(typeof ranks)[number]}s`,
	() => Effect.Effect<SingleRank[], UsersError | DBCallbackFailure | DatabaseError, never>
>;

/**
 * Input parameters for paginated queries.
 *
 * @property limit - The maximum number of items to return.
 * @property offset - The number of items to skip before starting to collect the result set.
 */
export type PaginateInput = {
	limit: number;
	offset: number;
};

/**
 * Error class for pagination-related issues.
 */
export class PaginateError extends Error {
	readonly _tag = 'PaginateError';
}

/**
 * KillSwitch used to short-circuit Effect chains.
 */
export class KillSwitch {
	readonly _tag = 'KillSwitch';
}

/**
 * SDKGetModule
 *
 * Effect generator that assembles and returns a read-only "GET" API for the StudioCMS SDK.
 * The module wires together database access, collectors, folder-tree utilities, caching/memoization,
 * schema decoding/encoding and other supporting services to produce a single object with
 * convenient, type-safe Effect-based getters.
 *
 * Key characteristics
 * - Returns an object `GET` containing grouped read operations (permissions, users, folders, pages, site config, etc.).
 * - All operations return Effect-based results (Effect.Effect<...>) and are composed with validation, decoding and error handling.
 * - Uses memoization with cache keys/tags for page-, folder- and tree-related queries to avoid redundant work.
 * - Uses collectors to supplement raw DB rows with computed/aggregated "collected" data for pages and users.
 * - Read-only: operations query database and services but do not mutate state.
 *
 * Main API surface (high level)
 * - GET.permissionsLists
 *   - all: returns combined ranks with their users.
 *   - <rank>s: dynamically generated convenience functions for each rank (e.g. owners, admins, editors, visitors).
 *
 * - GET.users
 *   - all(): returns all users (ghost user filtered out) with collected user data.
 *   - byId(id): returns collected user data for a user id or undefined if not found.
 *   - byUsername(username): returns collected user data for a username or undefined if not found.
 *   - byEmail(email): returns collected user data for an email or undefined if not found.
 *
 * - GET.folder(folderId)
 *   - Returns a memoized folder lookup by id (decoded).
 *
 * - GET.folderTree()
 *   - Returns the folder structure built from folder definitions (memoized).
 *
 * - GET.folderList()
 *   - Returns a list of available folders (memoized).
 *
 * - GET.siteConfig
 *   - Proxy to SDK config getter for site configuration.
 *
 * - GET.latestVersion()
 *   - Fetches the latest published version of StudioCMS from NPM.
 *
 * - GET.pages(includeDrafts?, hideDefaultIndex?, metaOnly?, paginate?)
 *   - Returns all pages (optionally paginated) and supports:
 *     - includeDrafts: include drafts when true.
 *     - hideDefaultIndex: exclude pages with slug "index" when true.
 *     - metaOnly: when true returns meta-only representations (no defaultContent / multiLangContent).
 *   - Validates pagination inputs (non-negative; default limit fallback).
 *   - Uses memoized per-page collectors and returns either CombinedPageData[] or MetaOnlyPageData[].
 *   - Errors are typed (e.g. DBCallbackFailure, FolderTreeError, DatabaseError, ParseResult.ParseError,
 *     PaginateError, CollectorError) — all surfaced through Effects.
 *
 * - GET.page.byId(id, metaOnly?)
 *   - Fetches a single page by id, collects full page data (or meta-only when requested).
 *   - Returns the page data or `undefined` when not found.
 *
 * - GET.page.bySlug(slug, metaOnly?)
 *   - Fetches a single page by slug, collects full page data (or meta-only when requested).
 *   - Returns the page data or `undefined` when not found.
 *
 * - GET.packagePages(packageName, metaOnly?)
 *   - Returns pages associated with a package. If none found, returns an empty array.
 *
 * - GET.folderPages(idOrName, includeDrafts?, hideDefaultIndex?, metaOnly?, paginate?)
 *   - Returns pages that belong to the given folder (identified by id or name).
 *   - Supports same filtering, metaOnly and pagination semantics as GET.pages.
 *
 * - GET.pageFolderTree(hideDefaultIndex?)
 *   - Returns a full folder tree structure enriched with pages placed into their folders.
 *   - Built by merging folder definitions and page data, memoized for efficiency.
 *
 * Implementation notes
 * - Internal helpers:
 *   - Schema-validated DB accessors (withCodec/withDecoder) provide typed DB reads.
 *   - collectUserData / collectPageData transform raw DB rows into richer domain objects.
 *   - memoize wraps potentially expensive collectors with cache keys and tags.
 *   - validatePagination enforces sane paging and returns a PaginateError for invalid input.
 *   - convertCombinedPageDataToMetaOnly strips content fields to produce meta-only return shapes.
 *   - Some flows use a KillSwitch sentinel to convert "not found" database results into benign undefined/empty results.
 *
 * Errors
 * - All functions return their results wrapped in Effect.Effect; errors from decoding, DB callbacks,
 *   collectors, pagination validation, or folder-tree construction flow through the Effect error channel.
 * - Page-related getters document a union of possible errors (DBCallbackFailure | FolderTreeError | DatabaseError |
 *   ParseResult.ParseError | PaginateError | CollectorError).
 *
 * Example usage (conceptual)
 * - GET.users.all()            -> Effect yielding collected user list
 * - GET.page.byId("abc")       -> Effect yielding CombinedPageData | undefined
 * - GET.pages(undefined, true) -> Effect yielding page list with default-index hidden
 *
 * Returns
 * - An object (`GET`) with the described grouped read-only operations; each operation is an Effect-producing function.
 */
export const SDKGetModule = Effect.gen(function* () {
	const [
		{ withCodec, withDecoder },
		{ verifyRank, combineRanks },
		{ collectUserData, collectPageData },
		{ siteConfig: sdkSiteConfig },
		{ GhostUserDefaults },
		{ memoize },
		{ buildFolderTree, getAvailableFolders, addPageToFolderTree },
		{ getVersion },
	] = yield* Effect.all([
		DBClientLive,
		SDKUsers,
		SDKCollectors,
		SDKConfigModule,
		SDKDefaults,
		CacheService,
		SDKFolderTree,
		GetFromNPM,
	]);

	// ===================================================
	// DB Operations
	// ===================================================

	/**
	 * Fetches all users from the database.
	 *
	 * @returns An array of user records from the StudioCMSUsersTable.
	 */
	const _getUsers = withDecoder({
		decoder: Schema.Array(StudioCMSUsersTable.Select),
		callbackFn: (db) =>
			db((client) => client.selectFrom('StudioCMSUsersTable').selectAll().execute()),
	});

	/**
	 * Fetches a user by their ID.
	 *
	 * @param userId - The ID of the user to fetch.
	 * @returns The user record if found, otherwise undefined.
	 */
	const _getUserById = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSUsersTable.Select),
		callbackFn: (db, userId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSUsersTable')
					.selectAll()
					.where('id', '=', userId)
					.executeTakeFirst()
			),
	});

	/**
	 * Fetches a user by their username.
	 *
	 * @param username - The username of the user to fetch.
	 * @returns The user record if found, otherwise undefined.
	 */
	const _getUserByUsername = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSUsersTable.Select),
		callbackFn: (db, username) =>
			db((client) =>
				client
					.selectFrom('StudioCMSUsersTable')
					.selectAll()
					.where('username', '=', username)
					.executeTakeFirst()
			),
	});

	/**
	 * Fetches a user by their email.
	 *
	 * @param email - The email of the user to fetch.
	 * @returns The user record if found, otherwise undefined.
	 */
	const _getUserByEmail = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSUsersTable.Select),
		callbackFn: (db, email) =>
			db((client) =>
				client
					.selectFrom('StudioCMSUsersTable')
					.selectAll()
					.where('email', '=', email)
					.executeTakeFirst()
			),
	});

	/**
	 * Fetches all current permissions from the database.
	 *
	 * @returns An array of permission records from the StudioCMSPermissions table.
	 */
	const _getCurrentPermissions = withDecoder({
		decoder: Schema.Array(StudioCMSPermissions.Select),
		callbackFn: (db) =>
			db((client) => client.selectFrom('StudioCMSPermissions').selectAll().execute()),
	});

	/**
	 * Fetches a folder by its ID.
	 *
	 * @param folderId - The ID of the folder to fetch.
	 * @returns The folder record if found, otherwise undefined.
	 */
	const _getFolder = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSPageFolderStructure.Select),
		callbackFn: (db, folderId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPageFolderStructure')
					.selectAll()
					.where('id', '=', folderId)
					.executeTakeFirst()
			),
	});

	/**
	 * Fetches all pages from the database with pagination.
	 *
	 * @param pagination - The pagination input containing limit and offset.
	 * @returns An array of page records from the StudioCMSPageData table.
	 */
	const _getAllPagesPaginated = withCodec({
		encoder: Schema.Struct({
			limit: Schema.Number,
			offset: Schema.Number,
		}),
		decoder: Schema.Array(StudioCMSPageData.Select),
		callbackFn: (db, { limit, offset }) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPageData')
					.selectAll()
					.orderBy('title', 'asc')
					.limit(limit)
					.offset(offset)
					.execute()
			),
	});

	/**
	 * Fetches all pages from the database.
	 *
	 * @returns An array of page records from the StudioCMSPageData table.
	 */
	const _getAllPagesBase = withDecoder({
		decoder: Schema.Array(StudioCMSPageData.Select),
		callbackFn: (db) =>
			db((client) =>
				client.selectFrom('StudioCMSPageData').selectAll().orderBy('title', 'asc').execute()
			),
	});

	/**
	 * Fetches a page by its ID.
	 */
	const _getPageByIdFromDB = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSPageData.Select),
		callbackFn: (db, pageId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPageData')
					.selectAll()
					.where('id', '=', pageId)
					.executeTakeFirst()
			),
	});

	/**
	 * Fetches a page by its slug.
	 */
	const _getPageBySlugFromDB = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSPageData.Select),
		callbackFn: (db, slug) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPageData')
					.selectAll()
					.where('slug', '=', slug)
					.executeTakeFirst()
			),
	});

	/**
	 * Fetches a page by its package ID.
	 */
	const _getPageByPackageFromDB = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSPageData.Select),
		callbackFn: (db, packageId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPageData')
					.selectAll()
					.where('package', '=', packageId)
					.executeTakeFirst()
			),
	});

	/**
	 * Fetches a folder by its name or ID.
	 */
	const _getFolderByNameOrId = withCodec({
		encoder: Schema.String,
		decoder: StudioCMSPageFolderStructure.Select,
		callbackFn: (db, folderId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPageFolderStructure')
					.selectAll()
					.where((eb) => eb.or([eb('id', '=', folderId), eb('name', '=', folderId)]))
					.executeTakeFirstOrThrow()
			),
	});

	// ===================================================
	// Helpers
	// ===================================================

	/**
	 * Verifies users by rank.
	 *
	 * @param rank - The rank to verify.
	 * @returns A function that takes users and permissions and returns users with the specified rank.
	 */
	const _verifyRank = (rank: (typeof StudioCMSPermissions.Select)['Type']['rank']) =>
		Effect.fn(
			({
				users,
				permissions,
			}: {
				users: readonly (typeof StudioCMSUsersTable.Select)['Type'][];
				permissions: readonly (typeof StudioCMSPermissions.Select)['Type'][];
			}) => verifyRank(users, permissions, rank)
		);

	/**
	 * Retrieves permissions for users based on a specified rank.
	 *
	 * @param rank - The rank to filter permissions by.
	 * @returns An array of user records with the specified rank.
	 */
	const _getPermissionsByRank = (rank: (typeof StudioCMSPermissions.Select)['Type']['rank']) =>
		Effect.all({
			permissions: _getCurrentPermissions(),
			users: _getUsers(),
		}).pipe(Effect.flatMap(_verifyRank(rank)));

	/**
	 * Combines a rank with its corresponding users.
	 *
	 * @param param0 - A tuple containing a rank and an array of users.
	 * @returns A combined rank record.
	 */
	const _combineRanks = ([rank, users]: readonly [Ranks, SingleRank[]]) =>
		combineRanks(rank, users);

	/**
	 * Processes and verifies users for each rank.
	 *
	 * @param ranks - An array of ranks to be processed.
	 * @returns A function that takes users and permissions and returns an array of tuples containing ranks and their corresponding users.
	 */
	const _processAndVerifyRanks = (ranks: readonly Ranks[]) =>
		Effect.fn(
			({
				users,
				permissions,
			}: {
				users: readonly (typeof StudioCMSUsersTable.Select)['Type'][];
				permissions: readonly (typeof StudioCMSPermissions.Select)['Type'][];
			}): Effect.Effect<[Ranks, SingleRank[]][], UsersError, never> =>
				Effect.forEach(ranks, (rank) =>
					verifyRank(users, permissions, rank).pipe(Effect.map((res) => [rank, res] as const))
				)
		);

	/**
	 * Combines ranks with their corresponding users.
	 *
	 * @returns An array of combined rank records.
	 */
	const _getCombinedRanks = Effect.fn(() =>
		Effect.all({
			permissions: _getCurrentPermissions(),
			users: _getUsers(),
		}).pipe(
			Effect.flatMap(_processAndVerifyRanks(ranks)),
			Effect.flatMap(Effect.forEach(_combineRanks)),
			Effect.map((data) => data.flat())
		)
	);

	/**
	 * Filters out the ghost user from a list of users.
	 *
	 * @param users - An array of user records.
	 * @returns An array of user records excluding the ghost user.
	 */
	const _filterOutGhostUser = Effect.fn((users: readonly tsUsersSelect[]) =>
		Effect.succeed(users.filter((user) => user.id !== GhostUserDefaults.id))
	);

	/**
	 * Aggregates all user data excluding the ghost user.
	 *
	 * @returns An array of user data records.
	 */
	const _getAllUsers = Effect.fn(() =>
		_getUsers().pipe(
			Effect.flatMap(_filterOutGhostUser),
			Effect.flatMap(Effect.forEach(collectUserData))
		)
	);

	/**
	 * Exposed function to get user by ID with collected data.
	 *
	 * @param userId - The ID of the user to fetch.
	 * @returns The user data record if found, otherwise undefined.
	 */
	const _getUserByIdExposed = Effect.fn((userId: string) =>
		_getUserById(userId).pipe(
			Effect.flatMap((user) => (user ? collectUserData(user) : Effect.succeed(undefined)))
		)
	);

	/**
	 * Exposed function to get user by username with collected data.
	 *
	 * @param username - The username of the user to fetch.
	 * @returns The user data record if found, otherwise undefined.
	 */
	const _getUserByUsernameExposed = Effect.fn((username: string) =>
		_getUserByUsername(username).pipe(
			Effect.flatMap((user) => (user ? collectUserData(user) : Effect.succeed(undefined)))
		)
	);

	/**
	 * Exposed function to get user by email with collected data.
	 *
	 * @param email - The email of the user to fetch.
	 * @returns The user data record if found, otherwise undefined.
	 */
	const _getUserByEmailExposed = Effect.fn((email: string) =>
		_getUserByEmail(email).pipe(
			Effect.flatMap((user) => (user ? collectUserData(user) : Effect.succeed(undefined)))
		)
	);

	/**
	 * Validates pagination input.
	 *
	 * @param paginate - The pagination input to validate.
	 * @returns The validated pagination input or an error.
	 */
	const validatePagination = Effect.fn(function* (paginate: PaginateInput) {
		if (paginate.limit < 0 || paginate.offset < 0) {
			return yield* Effect.fail(new PaginateError('Pagination values must be non-negative'));
		}
		if (paginate.limit === 0) {
			paginate.limit = 10;
		}
		return paginate;
	});

	/**
	 * Filters pages based on draft status and default index slug.
	 *
	 * @param pages - The array of page data objects to filter.
	 * @param includeDrafts - If `true`, includes draft pages; otherwise, excludes them.
	 * @param hideDefaultIndex - If `true`, excludes pages with the slug 'index'; otherwise, includes them.
	 * @returns The filtered array of page data objects.
	 */
	const __filterPagesByDraftAndIndex = Effect.fn(
		(pages: readonly tsPageDataSelect[], includeDrafts: boolean, hideDefaultIndex: boolean) =>
			Effect.succeed(
				pages.filter(
					({ draft, slug }) =>
						(includeDrafts || draft === false || draft === null) &&
						(!hideDefaultIndex || slug !== 'index')
				)
			)
	);

	/**
	 * Converts a `CombinedPageData` or an array of such objects to a meta-only representation,
	 * removing `defaultContent` and `multiLangContent`.
	 *
	 * @typeParam T - Either a single `CombinedPageData` or an array of them.
	 * @param data - The input object(s) containing page data.
	 * @returns The meta-only representation of the input, preserving all properties except `defaultContent` and `multiLangContent`.
	 */
	function convertCombinedPageDataToMetaOnly<T extends CombinedPageData[] | CombinedPageData>(
		data: T
	): PageDataReturnType<T> {
		if (Array.isArray(data)) {
			return data.map(
				({ defaultContent, multiLangContent, ...data }) => data
			) as PageDataReturnType<T>;
		}
		const { defaultContent: _dump1, multiLangContent: _dump2, ...metaOnlyData } = data;
		return metaOnlyData as unknown as PageDataReturnType<T>;
	}

	/**
	 * Handles pagination for page retrieval.
	 *
	 * @param paginate - Optional pagination parameters including `limit` and `offset`.
	 * @returns An Effect yielding an array of page data records.
	 */
	const __getPagesPossiblyPaginated = (paginate?: PaginateInput) =>
		paginate
			? validatePagination(paginate).pipe(Effect.flatMap(_getAllPagesPaginated))
			: _getAllPagesBase();

	/**
	 * Errors that can occur while retrieving all pages.
	 */
	type _PossiblePagesErrors =
		| DBCallbackFailure
		| FolderTreeError
		| DatabaseError
		| ParseResult.ParseError
		| PaginateError
		| CollectorError;

	function _getAllPages(
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		metaOnly?: false,
		paginate?: PaginateInput
	): Effect.Effect<CombinedPageData[], _PossiblePagesErrors, never>;

	function _getAllPages(
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		metaOnly?: true,
		paginate?: PaginateInput
	): Effect.Effect<MetaOnlyPageData[], _PossiblePagesErrors, never>;

	/**
	 * Retrieves all pages with optional filtering and pagination.
	 *
	 * @param includeDrafts - If `true`, includes draft pages; otherwise, excludes them.
	 * @param hideDefaultIndex - If `true`, excludes pages with the slug 'index'; otherwise, includes them.
	 * @param metaOnly - If `true`, returns only meta information about the pages; otherwise, returns full page data.
	 * @param paginate - Optional pagination parameters including `limit` and `offset`.
	 * @returns An array of page data records, either full or meta-only based on the `metaOnly` parameter.
	 */
	function _getAllPages(
		includeDrafts = false,
		hideDefaultIndex = false,
		metaOnly = false,
		paginate?: PaginateInput
	) {
		// Execute the page retrieval and processing
		return __getPagesPossiblyPaginated(paginate).pipe(
			Effect.flatMap((pagesRaw) =>
				Effect.all({
					pages: __filterPagesByDraftAndIndex(pagesRaw, includeDrafts, hideDefaultIndex),
					tree: GET.folderTree(),
				})
			),
			Effect.flatMap(({ pages, tree }) =>
				Effect.forEach(pages, (page) =>
					memoize(cacheKeyGetters.page(page.id), collectPageData(page, tree), {
						tags: cacheTags.pages,
					})
				)
			),
			Effect.map((data) => (metaOnly ? convertCombinedPageDataToMetaOnly(data) : data))
		);
	}

	function _getPageById(
		id: string
	): Effect.Effect<CombinedPageData | undefined, _PossiblePagesErrors, never>;
	function _getPageById(
		id: string,
		metaOnly?: boolean
	): Effect.Effect<MetaOnlyPageData | undefined, _PossiblePagesErrors, never>;

	/**
	 * Retrieves a page by its ID with optional meta-only data.
	 *
	 * @param id - The ID of the page to fetch.
	 * @param metaOnly - If `true`, returns only meta information about the page; otherwise, returns full page data.
	 * @returns The page data record if found, either full or meta-only based on the `metaOnly` parameter; otherwise, undefined.
	 */
	function _getPageById(id: string, metaOnly = false) {
		return _getPageByIdFromDB(id).pipe(
			Effect.flatMap((page) => (page ? Effect.succeed(page) : Effect.fail(new KillSwitch()))),
			Effect.flatMap((page) =>
				GET.folderTree().pipe(
					Effect.flatMap((tree) =>
						memoize(cacheKeyGetters.page(page.id), collectPageData(page, tree), {
							tags: cacheTags.pages,
						})
					)
				)
			),
			Effect.map((data) => (metaOnly === true ? convertCombinedPageDataToMetaOnly(data) : data)),
			Effect.catchTag('KillSwitch', () => Effect.succeed(undefined))
		) as typeof metaOnly extends true
			? Effect.Effect<MetaOnlyPageData | undefined, _PossiblePagesErrors, never>
			: Effect.Effect<CombinedPageData | undefined, _PossiblePagesErrors, never>;
	}

	function _getPageBySlug(
		slug: string
	): Effect.Effect<CombinedPageData | undefined, _PossiblePagesErrors, never>;
	function _getPageBySlug(
		slug: string,
		metaOnly?: boolean
	): Effect.Effect<MetaOnlyPageData | undefined, _PossiblePagesErrors, never>;

	/**
	 * Retrieves a page by its slug with optional meta-only data.
	 *
	 * @param slug - The slug of the page to fetch.
	 * @param metaOnly - If `true`, returns only meta information about the page; otherwise, returns full page data.
	 * @returns The page data record if found, either full or meta-only based on the `metaOnly` parameter; otherwise, undefined.
	 */
	function _getPageBySlug(slug: string, metaOnly = false) {
		return _getPageBySlugFromDB(slug).pipe(
			Effect.flatMap((page) => (page ? Effect.succeed(page) : Effect.fail(new KillSwitch()))),
			Effect.flatMap((page) =>
				GET.folderTree().pipe(
					Effect.flatMap((tree) =>
						memoize(cacheKeyGetters.page(page.id), collectPageData(page, tree), {
							tags: cacheTags.pages,
						})
					)
				)
			),
			Effect.map((data) => (metaOnly === true ? convertCombinedPageDataToMetaOnly(data) : data)),
			Effect.catchTag('KillSwitch', () => Effect.succeed(undefined))
		) as typeof metaOnly extends true
			? Effect.Effect<MetaOnlyPageData | undefined, _PossiblePagesErrors, never>
			: Effect.Effect<CombinedPageData | undefined, _PossiblePagesErrors, never>;
	}

	function _getPackagesPages(
		packageName: string
	): Effect.Effect<CombinedPageData[], _PossiblePagesErrors, never>;
	function _getPackagesPages(
		packageName: string,
		metaOnly?: boolean
	): Effect.Effect<MetaOnlyPageData[], _PossiblePagesErrors, never>;

	/**
	 * Retrieves pages associated with a specific package with optional meta-only data.
	 *
	 * @param packageName - The name of the package to fetch pages for.
	 * @param metaOnly - If `true`, returns only meta information about the pages; otherwise, returns full page data.
	 * @returns An array of page data records associated with the specified package, either full or meta-only based on the `metaOnly` parameter.
	 */
	function _getPackagesPages(packageName: string, metaOnly = false) {
		return _getPageByPackageFromDB(packageName).pipe(
			Effect.flatMap((page) => (page ? Effect.succeed(page) : Effect.fail(new KillSwitch()))),
			Effect.flatMap((page) =>
				GET.folderTree().pipe(
					Effect.flatMap((tree) =>
						memoize(cacheKeyGetters.page(page.id), collectPageData(page, tree), {
							tags: cacheTags.pages,
						})
					)
				)
			),
			Effect.map((data) => (metaOnly === true ? convertCombinedPageDataToMetaOnly(data) : data)),
			Effect.catchTag('KillSwitch', () => Effect.succeed([]))
		) as typeof metaOnly extends true
			? Effect.Effect<MetaOnlyPageData[], _PossiblePagesErrors, never>
			: Effect.Effect<CombinedPageData[], _PossiblePagesErrors, never>;
	}

	function _folderPages(
		idOrName: string,
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		metaOnly?: false,
		paginate?: PaginateInput
	): Effect.Effect<CombinedPageData[], _PossiblePagesErrors, never>;
	function _folderPages(
		idOrName: string,
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		metaOnly?: true,
		paginate?: PaginateInput
	): Effect.Effect<MetaOnlyPageData[], _PossiblePagesErrors, never>;

	/**
	 * Retrieves pages within a specific folder.
	 *
	 * @param idOrName - The ID or name of the folder.
	 * @returns An array of page data records within the specified folder.
	 */
	function _folderPages(
		idOrName: string,
		includeDrafts = false,
		hideDefaultIndex = false,
		metaOnly = false,
		paginate?: PaginateInput
	) {
		return _getFolderByNameOrId(idOrName).pipe(
			Effect.flatMap(({ id: folderId }) =>
				__getPagesPossiblyPaginated(paginate).pipe(
					Effect.flatMap((pagesRaw) =>
						__filterPagesByDraftAndIndex(
							pagesRaw.filter((page) => page.parentFolder === folderId),
							includeDrafts,
							hideDefaultIndex
						)
					),
					Effect.flatMap((pages) =>
						Effect.all({
							pages: Effect.succeed(pages),
							tree: GET.folderTree(),
						})
					),
					Effect.flatMap(({ pages, tree }) =>
						Effect.forEach(pages, (page) =>
							memoize(cacheKeyGetters.page(page.id), collectPageData(page, tree), {
								tags: cacheTags.pages,
							})
						)
					),
					Effect.map((data) => (metaOnly ? convertCombinedPageDataToMetaOnly(data) : data))
				)
			)
		) as typeof metaOnly extends true
			? Effect.Effect<MetaOnlyPageData[], _PossiblePagesErrors, never>
			: Effect.Effect<CombinedPageData[], _PossiblePagesErrors, never>;
	}

	/**
	 * Retrieves the page folder tree structure.
	 *
	 * @param hideDefaultIndex - If `true`, excludes pages with the slug 'index' from the tree; otherwise, includes them.
	 * @returns The page folder tree structure.
	 */
	const _pageFolderTree = (hideDefaultIndex = false) =>
		Effect.gen(function* () {
			const [tree, pages] = yield* Effect.all([
				GET.folderTree(),
				_getAllPages(true, hideDefaultIndex),
			]);

			for (const page of pages) {
				if (page.parentFolder) {
					yield* addPageToFolderTree(tree, page.parentFolder, {
						id: page.id,
						name: page.title,
						page: true,
						pageData: page,
						children: [],
					});
				} else {
					tree.push({
						id: page.id,
						name: page.title,
						page: true,
						pageData: page,
						children: [],
					});
				}
			}

			return tree;
		});

	// ===================================================
	// GET Operations
	// ===================================================

	/**
	 * Aggregated GET operations for the SDK.
	 */
	const GET = {
		/**
		 * Lists of permissions categorized by user ranks.
		 */
		permissionsLists: {
			/**
			 * Retrieves all combined ranks with their corresponding users.
			 *
			 * @returns An array of combined rank records.
			 */
			all: _getCombinedRanks,

			// Dynamically generate functions for each rank (e.g., owners, admins, editors, visitors)
			...ranks.reduce((acc, rank) => {
				acc[`${rank}s`] = () => _getPermissionsByRank(rank);
				return acc;
			}, {} as PartialPermissionList),
		},

		/**
		 * User-related GET operations.
		 */
		users: {
			/**
			 * Retrieves all users excluding the ghost user.
			 *
			 * @returns An array of user data records.
			 */
			all: _getAllUsers,

			/**
			 * Retrieves a user by their ID.
			 *
			 * @param userId - The ID of the user to fetch.
			 * @returns The user data record if found, otherwise undefined.
			 */
			byId: _getUserByIdExposed,

			/**
			 * Retrieves a user by their username.
			 *
			 * @param username - The username of the user to fetch.
			 * @returns The user data record if found, otherwise undefined.
			 */
			byUsername: _getUserByUsernameExposed,

			/**
			 * Retrieves a user by their email.
			 *
			 * @param email - The email of the user to fetch.
			 * @returns The user data record if found, otherwise undefined.
			 */
			byEmail: _getUserByEmailExposed,
		},

		/**
		 * Retrieves a folder by its ID.
		 *
		 * @param folderId - The ID of the folder to fetch.
		 * @returns The folder record if found, otherwise undefined.
		 */
		folder: Effect.fn((folderId: string) =>
			memoize(cacheKeyGetters.folder(folderId), _getFolder(folderId), {
				tags: cacheTags.folder,
			})
		),

		/**
		 * Retrieves the folder tree structure.
		 *
		 * @returns The folder tree structure.
		 */
		folderTree: () => buildFolderTree,

		/**
		 * Retrieves a list of folders.
		 *
		 * @returns An array of folder records.
		 */
		folderList: () =>
			memoize(cacheKeyGetters.folderList(), getAvailableFolders, {
				tags: cacheTags.folderList,
			}),

		/**
		 * Retrieves the site configuration.
		 *
		 * @returns The site configuration object.
		 */
		siteConfig: sdkSiteConfig.get,

		/**
		 * Retrieves the latest version of StudioCMS from NPM.
		 *
		 * @returns The latest version string.
		 */
		latestVersion: () => getVersion('studiocms'),

		/**
		 * Retrieves all pages.
		 *
		 * @returns An array of page data records.
		 */
		pages: _getAllPages,

		/**
		 * Utilities to get pages by specific criteria.
		 */
		page: {
			/**
			 * Retrieves a page by its ID.
			 *
			 * @param id - The ID of the page to fetch.
			 * @returns The page data record if found, otherwise undefined.
			 */
			byId: _getPageById,

			/**
			 * Retrieves a page by its slug.
			 *
			 * @param slug - The slug of the page to fetch.
			 * @returns The page data record if found, otherwise undefined.
			 */
			bySlug: _getPageBySlug,
		},

		/**
		 * Retrieves pages associated with a specific package.
		 *
		 * @param packageName - The name of the package to fetch pages for.
		 * @returns An array of page data records associated with the specified package.
		 */
		packagePages: _getPackagesPages,

		/**
		 * Retrieves pages within a specific folder.
		 *
		 * @param idOrName - The ID or name of the folder.
		 * @returns An array of page data records within the specified folder.
		 */
		folderPages: _folderPages,

		/**
		 * Retrieves the page folder tree structure.
		 *
		 * @returns The page folder tree structure.
		 */
		pageFolderTree: _pageFolderTree,
	};

	return GET;
});

export default SDKGetModule;
