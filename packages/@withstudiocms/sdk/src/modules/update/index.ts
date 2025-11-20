import { Effect, Schema } from '@withstudiocms/effect';
import {
	StudioCMSPageContent,
	StudioCMSPageData,
	StudioCMSPageDataCategories,
	StudioCMSPageDataTags,
	StudioCMSPageFolderStructure,
	StudioCMSPermissions,
} from '@withstudiocms/kysely';
import CacheService from '../../cache.js';
import { cacheKeyGetters, cacheTags } from '../../consts.js';
import { DBClientLive } from '../../context.js';
import SDKClearModule from '../clear/index.js';
import SDKConfigModule from '../config/index.js';
import SDKGetModule from '../get/index.js';

/**
 * CombinedPageUpdateData
 *
 * Type representing the combined data required to update both page data and page content.
 */
type CombinedPageUpdateData = {
	pageData: (typeof StudioCMSPageData.Update)['Type'];
	pageContent: (typeof StudioCMSPageContent.Update)['Type'];
};

/**
 * SDKUpdateModule
 *
 * Effect generator that constructs and returns the SDK "UPDATE" module containing all update-related operations
 * for the StudioCMS domain. Each operation is implemented as an Effect and typically combines:
 * - a DB update operation (wrapped with a codec for runtime encode/decode/validation),
 * - optional cache invalidation or cache refresh,
 * - and retrieval of the fresh resource via the GET module when appropriate.
 *
 * @module SDKUpdateModule
 *
 * @remarks
 * - Dependencies resolved by the generator: DBClientLive, CacheService, SDKClearModule, SDKGetModule, SDKConfigModule.
 * - DB operations are created via withCodec with corresponding encoder/decoder codecs (e.g. StudioCMSPageContent, StudioCMSPageData, StudioCMSPermissions, etc.).
 * - Cache-related operations include clearing/invalidation of folder tree/list caches, page-specific cache deletion, and npm package cache tag invalidation.
 * - Composite helpers coordinate multi-step flows, e.g. updating page content + page data + deleting the page cache, then returning the fresh page via GET.
 * - All operations are effectful and intended to be executed inside the Effect runtime; callers should compose and run them using the Effect primitives provided by the environment.
 *
 * @returns {{
 *   pageContent: Effect, tags: Effect, categories: Effect, permissions: Effect,
 *   folderTree: Effect, folderList: Effect, folder: Effect,
 *   latestVersion: Effect, siteConfig: Effect,
 *   page: { byId: Effect, bySlug: Effect }
 * }}
 * An object exposing update operations:
 * - pageContent, tags, categories, permissions: DB update Effects returning the updated record.
 * - folderTree, folderList: Effects that refresh corresponding caches.
 * - folder: updates a folder entry and invalidates/refreshes folder caches.
 * - latestVersion: invalidates npm package cache tags and fetches the latest package version.
 * - siteConfig: forwards to CONFIG.siteConfig.update.
 * - page.byId: updates page data and content, deletes the page cache, refreshes folder caches, then returns the updated page.
 * - page.bySlug: resolves the page id by slug and delegates to page.byId.
 *
 * @example
 * // Typical usage inside an Effect:
 * // yield* Effect.flatMap(UPDATE.page.byId('pageId', combinedPageUpdateData))
 *
 * @threadSafety
 * Effects encapsulate async side effects; callers should treat composite updates as atomic logical operations but not assume cross-operation DB transactions unless provided by the DB client.
 *
 * @errors
 * - DB client errors (e.g. executeTakeFirstOrThrow) propagate as Effect failures.
 * - Codec validation errors are raised if supplied data does not conform to the expected codec schemas.
 *
 * @see SDKGetModule for read operations
 * @see SDKClearModule for explicit cache clearing operations
 */
export const SDKUpdateModule = Effect.gen(function* () {
	const [{ withCodec }, CACHE, CLEAR, GET, CONFIG] = yield* Effect.all([
		DBClientLive,
		CacheService,
		SDKClearModule,
		SDKGetModule,
		SDKConfigModule,
	]);

	// =====================================
	// DB Operations
	// =====================================

	/**
	 * Update Page Content Operation
	 */
	const _updatePageContent = withCodec({
		encoder: StudioCMSPageContent.Update,
		decoder: StudioCMSPageContent.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.updateTable('StudioCMSPageContent')
					.set(data)
					.where('id', '=', data.id)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Update Tag Operation
	 */
	const _updateTag = withCodec({
		encoder: StudioCMSPageDataTags.Update,
		decoder: StudioCMSPageDataTags.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.updateTable('StudioCMSPageDataTags')
					.set(data)
					.where('id', '=', data.id)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Update Category Operation
	 */
	const _updateCategory = withCodec({
		encoder: StudioCMSPageDataCategories.Update,
		decoder: StudioCMSPageDataCategories.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.updateTable('StudioCMSPageDataCategories')
					.set(data)
					.where('id', '=', data.id)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Update Permission Operation
	 */
	const _updatePermission = withCodec({
		encoder: StudioCMSPermissions.Update,
		decoder: StudioCMSPermissions.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.updateTable('StudioCMSPermissions')
					.set(data)
					.where('user', '=', data.user)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Update Folder Entry Operation
	 */
	const _updateFolderEntry = withCodec({
		encoder: StudioCMSPageFolderStructure.Update,
		decoder: StudioCMSPageFolderStructure.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.updateTable('StudioCMSPageFolderStructure')
					.set(data)
					.where('id', '=', data.id)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Update Page Data Entry Operation
	 */
	const _updatePageDataEntry = withCodec({
		encoder: StudioCMSPageData.Update,
		decoder: StudioCMSPageData.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.updateTable('StudioCMSPageData')
					.set(data)
					.where('id', '=', data.id)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Find Page Data by Slug
	 */
	const _findPageDataBySlug = withCodec({
		encoder: Schema.String,
		decoder: StudioCMSPageData.Select,
		callbackFn: (db, slug: string) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPageData')
					.where('slug', '=', slug)
					.selectAll()
					.executeTakeFirstOrThrow()
			),
	});

	// =====================================
	// Helpers
	// =====================================

	/**
	 * Update Folder Tree Cache
	 */
	const _updateFolderTree = CLEAR.folderTree.pipe(Effect.flatMap(GET.folderTree));

	/**
	 * Update Folder List Cache
	 */
	const _updateFolderList = CLEAR.folderList.pipe(Effect.flatMap(GET.folderList));

	/**
	 * Update Folder Entry and Invalidate Related Caches
	 */
	const _updateFolderEntryAndInvalidate = Effect.fn(
		(data: (typeof StudioCMSPageFolderStructure.Update)['Type']) =>
			_updateFolderEntry(data).pipe(
				Effect.flatMap((src) => _updateFolderTree.pipe(Effect.as(src))),
				Effect.flatMap((src) => _updateFolderList.pipe(Effect.as(src)))
			)
	);

	/**
	 * Update Latest NPM Package Version
	 */
	const _updateLatestVersion = Effect.fn(() =>
		CACHE.invalidateTags(cacheTags.npmPackage).pipe(Effect.flatMap(GET.latestVersion))
	);

	/**
	 * Update Folder Tree and List Cache
	 */
	const _updateFolderTreeAndList = Effect.all([_updateFolderTree, _updateFolderList]);

	/**
	 * Update Page by ID
	 */
	const _updatePageById = Effect.fn((pageId: string, data: CombinedPageUpdateData) =>
		Effect.all([
			_updatePageDataEntry(data.pageData),
			_updatePageContent(data.pageContent),
			CACHE.delete(cacheKeyGetters.page(pageId)),
		]).pipe(
			Effect.tap(() => _updateFolderTreeAndList),
			Effect.flatMap(() => GET.page.byId(pageId))
		)
	);

	/**
	 * Find Page ID by Slug
	 */
	const _findPageIdBySlug = Effect.fn((slug: string) =>
		_findPageDataBySlug(slug).pipe(Effect.map(({ id }) => id))
	);

	/**
	 * Update Page by ID Piped Helper
	 */
	const _updatePageByIdPiped = (data: CombinedPageUpdateData) =>
		Effect.fn((id: string) => _updatePageById(id, data));

	/**
	 * Update Page by Slug
	 */
	const _updatePageBySlug = Effect.fn((slug: string, data: CombinedPageUpdateData) =>
		_findPageIdBySlug(slug).pipe(Effect.flatMap(_updatePageByIdPiped(data)))
	);

	// =====================================
	// Exposed Module Operations
	// =====================================

	/**
	 * SDK Update Module
	 */
	const UPDATE = {
		/**
		 * Update Page Content
		 *
		 * @param data - The page content data to update.
		 * @returns The updated page content.
		 */
		pageContent: _updatePageContent,

		/**
		 * Update Tag
		 *
		 * @param data - The tag data to update.
		 * @returns The updated tag.
		 */
		tags: _updateTag,

		/**
		 * Update Category
		 *
		 * @param data - The category data to update.
		 * @returns The updated category.
		 */
		categories: _updateCategory,

		/**
		 * Update Permissions
		 *
		 * @param data - The permissions data to update.
		 * @returns The updated permissions.
		 */
		permissions: _updatePermission,

		/**
		 * Update Folder Tree Cache
		 */
		folderTree: _updateFolderTree,

		/**
		 * Update Folder List Cache
		 */
		folderList: _updateFolderList,

		/**
		 * Update Folder Entry and Invalidate Related Caches
		 *
		 * @param data - The folder entry data to update.
		 * @returns The updated folder entry.
		 */
		folder: _updateFolderEntryAndInvalidate,

		/**
		 * Update Latest NPM Package Version
		 */
		latestVersion: _updateLatestVersion,

		/**
		 * Update Site Configuration
		 */
		siteConfig: CONFIG.siteConfig.update,

		/**
		 * Page Operations
		 */
		page: {
			/**
			 * Update Page by ID
			 */
			byId: _updatePageById,

			/**
			 * Update Page by Slug
			 */
			bySlug: _updatePageBySlug,
		},
	};

	return UPDATE;
});

export default SDKUpdateModule;
