import _logger, { isVerbose } from 'studiocms:logger';
import { Effect, genLogger } from '../../../effect.js';
import { CacheContext, isCacheEnabled } from '../utils.js';
import { SDKCore_GET } from './get.js';
import { SDKCore_PLUGINS } from './plugins.js';

const cacheId = '__last_updated_at';

const cacheTTL = 30 * 60 * 1000; // 30 minutes

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

			const Caches = new Map<
				string,
				// biome-ignore lint/suspicious/noExplicitAny: Allow any for cache and updater types
				{ cache: Map<string, any>; updater: () => Effect.Effect<any, unknown, never> }
			>([
				['pages', { cache: pages, updater: () => updatePages(true) }],
				['folderList', { cache: FolderList, updater: () => updateFolderList() }],
				['folderTree', { cache: folderTree, updater: () => updateFolderTree() }],
				['pageFolderTree', { cache: pageFolderTree, updater: () => updatePageFolderTree() }],
				['siteConfig', { cache: siteConfig, updater: () => updateSiteConfig() }],
				['pluginData', { cache: pluginData, updater: () => initPluginDataCache() }],
			]);

			const logger = _logger.fork('studiocms:middleware/cacheVerification');

			const middlewares = {
				verifyCache: (cacheStore: Map<string, Date>) =>
					genLogger('studiocms/sdk/SDKCore/modules/middlewares/verifyCache')(function* () {
						// Check if cache is enabled before proceeding
						const cacheStatus = yield* isCacheEnabled.pipe(
							Effect.catchAll(() => Effect.succeed(false))
						);

						// If cache is not enabled, we skip the verification
						// and return early to avoid unnecessary operations.
						if (!cacheStatus) return;

						// Log the cache verification process
						isVerbose && logger.info('Verifying caches...');

						// biome-ignore lint/suspicious/noExplicitAny: Allow any for todos type
						const todos: Effect.Effect<any, unknown, never>[] = [];

						function createTodoList(message: string) {
							isVerbose && logger.info(message);
							Caches.forEach(({ cache, updater }, name) => {
								if (cache.size === 0) {
									isVerbose && logger.info(`Cache "${name}" is empty, updating...`);
									todos.push(updater());
								} else {
									isVerbose && logger.info(`Cache "${name}" is already populated.`);
								}
							});
						}

						const lastCacheUpdate = cacheStore.get(cacheId);

						if (lastCacheUpdate) {
							isVerbose && logger.info(`Last cache update was at ${lastCacheUpdate.toISOString()}`);
							// check if cache is stale
							if (Date.now() - lastCacheUpdate.getTime() > cacheTTL) {
								createTodoList('Cache is stale, updating...');
							} else {
								isVerbose && logger.info('Cache is fresh.');
								return;
							}
						} else {
							createTodoList('No cache found, updating...');
						}

						// If there are no caches to update, we log and return
						if (todos.length === 0) {
							isVerbose && logger.info('All caches are already populated.');
							cacheStore.set(cacheId, new Date());
							return;
						}

						// Log the caches that are being updated
						isVerbose && logger.info(`Updating caches: ${todos.length} caches to update.`);
						const start = Date.now();
						yield* Effect.all(todos);
						isVerbose && logger.info(`Cache verification completed in ${Date.now() - start}ms.`);
						cacheStore.set(cacheId, new Date());
					}),
			};

			return middlewares;
		}),
	}
) {}
