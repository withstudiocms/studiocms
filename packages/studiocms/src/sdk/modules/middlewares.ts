import { Effect, genLogger } from '../../effect.js';
import { CacheContext, isCacheEnabled } from '../utils.js';
import { SDKCore_GET } from './get.js';
import { SDKCore_PLUGINS } from './plugins.js';

/**
 * SDKCore_MIDDLEWARES provides middleware initialization logic for the StudioCMS SDK core.
 *
 * @remarks
 * This service is responsible for ensuring that various cache layers (pages, folder list, folder tree,
 * page-folder tree, and site configuration) are properly initialized before use. It leverages effectful
 * operations and logging to manage and trace the initialization process.
 *
 * @extends Effect.Service
 *
 * @example
 * ```typescript
 * const middlewares = yield* Effect.service(SDKCore_MIDDLEWARES);
 * yield* middlewares.initPages();
 * ```
 *
 * @module studiocms/sdk/SDKCore/modules/middlewares
 *
 * @property {Function} initPages - Initializes all relevant caches if they are not already populated.
 */
export class SDKCore_MIDDLEWARES extends Effect.Service<SDKCore_MIDDLEWARES>()(
	'studiocms/sdk/SDKCore/modules/middlewares',
	{
		dependencies: [SDKCore_GET.Default, SDKCore_PLUGINS.Default],
		effect: genLogger('studiocms/sdk/SDKCore/modules/middlewares/effect')(function* () {
			const [
				{ FolderList, pages, folderTree, siteConfig, pageFolderTree, pluginData },
				{
					pages: updatePages,
					folderTree: updateFolderTree,
					pageFolderTree: updatePageFolderTree,
					folderList: updateFolderList,
					siteConfig: updateSiteConfig,
				},
				{ initPluginDataCache },
			] = yield* Effect.all([CacheContext, SDKCore_GET, SDKCore_PLUGINS]);

			const CachesToCheck = [
				{ cache: pages, updater: () => updatePages(true) },
				{ cache: FolderList, updater: () => updateFolderList() },
				{ cache: folderTree, updater: () => updateFolderTree() },
				{ cache: pageFolderTree, updater: () => updatePageFolderTree() },
				{ cache: siteConfig, updater: () => updateSiteConfig() },
				{ cache: pluginData, updater: () => initPluginDataCache() },
			];

			const middlewares = {
				verifyCache: () =>
					genLogger('studiocms/sdk/SDKCore/modules/middlewares/verifyCache')(function* () {
						// Check if cache is enabled before proceeding
						const cacheStatus = yield* isCacheEnabled.pipe(
							Effect.catchAll(() => Effect.succeed(false))
						);

						// If cache is not enabled, we skip the verification
						// and return early to avoid unnecessary operations.
						if (!cacheStatus) return;

						// Log the cache verification process
						yield* Effect.log('Verifying caches...');

						// Iterate through the caches and update them if they are empty
						const todos = CachesToCheck.flatMap(({ cache, updater }) =>
							cache.size === 0 ? [updater()] : []
						);

						// If there are no caches to update, we log and return
						if (todos.length === 0) {
							yield* Effect.log('All caches are already populated.');
							return;
						}

						// Log the caches that are being updated
						yield* Effect.log(`Updating caches: ${todos.length} caches to update.`);
						const start = Date.now();
						yield* Effect.all(todos);
						yield* Effect.log(`Cache verification completed in ${Date.now() - start}ms.`);
					}),
			};

			return middlewares;
		}),
	}
) {}
