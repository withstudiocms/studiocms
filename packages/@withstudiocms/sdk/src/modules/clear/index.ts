import { Effect } from '@withstudiocms/effect';
import CacheService from '../../cache.js';
import { cacheKeyGetters, cacheTags } from '../../consts.js';

/**
 * Effect that provides a collection of cache-clearing helpers for the SDK.
 *
 * This generator yields the CacheService and returns a CLEAR object containing effects and effect-creating
 * functions to delete individual cache entries or invalidate groups of cache tags used across the system.
 *
 * Returned CLEAR shape:
 * - page.byId(id: string): Effect<void>
 *   Deletes a single cached page entry by its ID (uses cacheKeyGetters.page and CacheService.delete).
 *
 * - pages: Effect<void>
 *   Invalidates tags related to pages, page folder trees, folder trees and folder lists.
 *
 * - latestVersion: Effect<void>
 *   Invalidates tags for NPM package metadata (e.g. cached latest package versions).
 *
 * - folderTree: Effect<void>
 *   Invalidates folder tree and page folder tree tags.
 *
 * - folderList: Effect<void>
 *   Invalidates the folder list tags.
 *
 * Remarks:
 * - Each member is an Effect (or a function returning an Effect) that resolves when the cache operation completes.
 * - The module internally depends on CacheService as well as cacheKeyGetters and cacheTags.
 *
 * @returns An Effect that resolves to an object exposing the described cache-clearing helpers.
 *
 * @example
 * // within an Effect.gen or other Effect context:
 * const CLEAR = yield* SDKClearModule;
 * yield* CLEAR.page.byId("some-page-id");
 * yield* CLEAR.pages;
 */
export const SDKClearModule = Effect.gen(function* () {
	const { invalidateTags, delete: deleteEntry } = yield* CacheService;

	/**
	 * Clears cached data related to various entities.
	 */
	const CLEAR = {
		/**
		 * Clears a cached page by its ID.
		 * @param id - The ID of the page to clear from the cache.
		 * @returns An Effect that resolves when the operation is complete.
		 */
		page: {
			/**
			 * Clears a cached page by its ID.
			 * @param id - The ID of the page to clear from the cache.
			 * @returns An Effect that resolves when the operation is complete.
			 */
			byId: Effect.fn((id: string) => deleteEntry(cacheKeyGetters.page(id))),
		},

		/**
		 * Clears cached data related to various entities.
		 * @returns An Effect that resolves when the operation is complete.
		 */
		pages: invalidateTags([
			...cacheTags.pages,
			...cacheTags.pageFolderTree,
			...cacheTags.folderTree,
			...cacheTags.folderList,
		]),

		/**
		 * Clears cached data related to the latest NPM package versions.
		 * @returns An Effect that resolves when the operation is complete.
		 */
		latestVersion: invalidateTags(cacheTags.npmPackage),

		/**
		 * Clears cached folder trees and page folder trees.
		 * @returns An Effect that resolves when the operation is complete.
		 */
		folderTree: invalidateTags([...cacheTags.folderTree, ...cacheTags.pageFolderTree]),

		/**
		 * Clears the cached folder list.
		 * @returns An Effect that resolves when the operation is complete.
		 */
		folderList: invalidateTags(cacheTags.folderList),
	};

	return CLEAR;
});

export default SDKClearModule;
