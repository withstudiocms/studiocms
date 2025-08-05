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

			const middlewares = {
				verifyCache: () =>
					genLogger('studiocms/sdk/SDKCore/modules/middlewares/verifyCache')(function* () {
						// Ensure the pages cache is initialized
						if ((yield* isCacheEnabled) && pages.size === 0) {
							yield* updatePages(true);
						}

						// Ensure the folderList cache is initialized
						if ((yield* isCacheEnabled) && FolderList.size === 0) {
							yield* updateFolderList();
						}

						// Ensure the FolderTree is initialized
						if ((yield* isCacheEnabled) && folderTree.size === 0) {
							yield* updateFolderTree();
						}

						// Ensure the pageFolderTree is initialized
						if ((yield* isCacheEnabled) && pageFolderTree.size === 0) {
							yield* updatePageFolderTree();
						}

						// Ensure the siteConfig is initialized
						if ((yield* isCacheEnabled) && siteConfig.size === 0) {
							yield* updateSiteConfig();
						}

						// Ensure the plugin data cache is initialized
						if ((yield* isCacheEnabled) && pluginData.size === 0) {
							yield* initPluginDataCache();
						}
					}),
			};

			return middlewares;
		}),
	}
) {}
