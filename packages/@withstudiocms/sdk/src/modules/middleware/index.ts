import { Duration, Effect } from '@withstudiocms/effect';
import CacheService from '../../cache.js';
import { cacheKeyGetters, cacheTags } from '../../consts.js';
import SDKGetModule from '../get/index.js';
import SDKPluginsModule from '../plugins/index.js';

/**
 * SDKMiddlewareModule
 *
 * Initializes and exposes middleware-related effects for the SDK.
 *
 * This module composes several underlying services (SDKGetModule, SDKPluginsModule,
 * CacheService) to produce a memoized effect that verifies and populates middleware
 * caches used across the application. The verification process updates:
 * - pages (with a forced refresh)
 * - folder tree
 * - page-folder tree
 * - folder list
 * - site configuration
 * - plugin data cache
 *
 * The verification effect logs the start and end of the operation and measures the
 * duration for performance monitoring.
 *
 * The primary exported value is:
 * - verifyCache: a memoized Effect that runs the full cache verification pipeline.
 *
 * Key behaviors and guarantees
 * - Memoized: verifyCache is wrapped with a memoization layer (tags: middleware)
 *   and configured with a TTL of 30 minutes to avoid redundant executions.
 * - Side effects: the effect performs network/cache updates and logging.
 * - Concurrency: repeated invocations while a verification is in progress will
 *   leverage the memoization to avoid duplicating work for the same cache key.
 * - Failure semantics: failures from any underlying update (pages, folder tree,
 *   plugin initialization, etc.) will propagate through the effect; callers should
 *   handle or surface errors as appropriate.
 * - Cancellation: the effect follows the cancellation semantics of the underlying
 *   Effect runtime (i.e., it may be cancelable depending on the implementation of
 *   the composed effects).
 *
 * Usage:
 * - Run or schedule verifyCache to ensure middleware caches are initialized and kept
 *   fresh. Because it is memoized with a TTL, it is inexpensive to call repeatedly
 *   from different parts of the system.
 *
 * @remarks
 * - This module has implicit dependencies on SDKGetModule, SDKPluginsModule and
 *   CacheService; it should be provided/loaded within the same Effect environment.
 *
 * @returns An object containing:
 *   - verifyCache: a memoized Effect that verifies and initializes middleware caches.
 *
 * @example
 * // Example invocation (pseudocode)
 * // yield* Effect.flatMap(SDKMiddlewareModule, ({ verifyCache }) => verifyCache)
 */
export const SDKMiddlewareModule = Effect.gen(function* () {
	const [
		{
			pages: updatePages,
			folderTree: updateFolderTree,
			pageFolderTree: updatePageFolderTree,
			folderList: updateFolderList,
			siteConfig: updateSiteConfig,
		},
		{ initPluginDataCache },
		{ memoize },
	] = yield* Effect.all([SDKGetModule, SDKPluginsModule, CacheService]);

	/**
	 * Effect to verify and initialize middleware-related caches.
	 *
	 * This effect checks and populates various caches including pages, folder list,
	 * folder tree, page-folder tree, site configuration, and plugin data. It logs the
	 * duration of the verification process for performance monitoring.
	 */
	const _verifyCacheEffect = Effect.log('Verifying middleware caches...').pipe(
		Effect.map(() => Date.now()),
		Effect.flatMap((startTime) =>
			Effect.all({
				pages: updatePages(true),
				folderTree: updateFolderTree(),
				pageFolderTree: updatePageFolderTree(),
				folderList: updateFolderList(),
				siteConfig: updateSiteConfig(),
				pluginData: initPluginDataCache(),
				startTime: Effect.succeed(startTime),
			})
		),
		Effect.flatMap(({ startTime }) => Effect.succeed({ startTime, endTime: Date.now() })),
		Effect.flatMap(({ startTime, endTime }) =>
			Effect.log(`Middleware caches verified in ${endTime - startTime}ms.`)
		)
	);

	/**
	 * Memoized effect to verify middleware caches.
	 *
	 * This effect uses memoization to cache the results of the verification process,
	 * ensuring that repeated calls with the same parameters do not result in redundant
	 * operations. It is tagged appropriately for cache management.
	 */
	const verifyCache = Effect.fn(() =>
		memoize(cacheKeyGetters.middleware(), _verifyCacheEffect, {
			tags: cacheTags.middleware,
			ttl: Duration.minutes(30),
		})
	);

	return {
		verifyCache,
	};
});

export default SDKMiddlewareModule;
