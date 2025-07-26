import { Effect, genLogger } from '../../effect.js';
import { CacheContext, _ClearUnknownError, isCacheEnabled } from '../utils.js';

/**
 * Provides cache clearing operations for various entities in the SDKCore module.
 *
 * @remarks
 * This service exposes methods to clear cached data for pages, folders, folder trees, and version information.
 * Each method checks if the cache is enabled before performing the clear operation.
 * Errors are caught and handled using custom error handlers for unknown exceptions.
 *
 * @example
 * ```typescript
 * const clearService = new SDKCore_CLEAR();
 * await clearService.page.byId('pageId');
 * await clearService.pages();
 * ```
 *
 * @class SDKCore_CLEAR
 * @extends Effect.Service
 *
 * @method page.byId - Clears a cached page by its ID.
 * @method page.bySlug - Clears cached pages by their slug.
 * @method pages - Clears all cached pages, folder trees, and folder lists.
 * @method latestVersion - Clears the cached latest version information.
 * @method folderTree - Clears cached folder trees and page folder trees.
 * @method folderList - Clears the cached folder list.
 */
export class SDKCore_CLEAR extends Effect.Service<SDKCore_CLEAR>()(
	'studiocms/sdk/SDKCore/modules/clear',
	{
		dependencies: [],
		effect: genLogger('studiocms/sdk/SDKCore/modules/clear/effect')(function* () {
			const { pages, FolderList, folderTree, pageFolderTree, version } = yield* CacheContext;

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

			return CLEAR;
		}),
	}
) {}
