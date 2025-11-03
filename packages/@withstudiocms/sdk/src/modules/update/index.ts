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
	const _updatePageById = Effect.fn(
		(
			pageId: string,
			data: {
				pageData: (typeof StudioCMSPageData.Update)['Type'];
				pageContent: (typeof StudioCMSPageContent.Update)['Type'];
			}
		) =>
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
	 * Update Page by Slug
	 */
	const _updatePageBySlug = Effect.fn(
		(
			slug: string,
			data: {
				pageData: (typeof StudioCMSPageData.Update)['Type'];
				pageContent: (typeof StudioCMSPageContent.Update)['Type'];
			}
		) =>
			_findPageDataBySlug(slug).pipe(
				Effect.flatMap(({ id: pageId }) => _updatePageById(pageId, data))
			)
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
