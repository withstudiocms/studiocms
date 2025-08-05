import { Effect } from '../effect.js';
import {
	AstroDB,
	SDKCore_Collectors,
	SDKCore_FolderTree,
	SDKCore_Generators,
	SDKCore_Parsers,
	SDKCore_Users,
} from './effect/index.js';
import { SDKCore_AUTH } from './modules/auth.js';
import { SDKCore_CLEAR } from './modules/clear.js';
import { SDKCore_DELETE } from './modules/delete.js';
import { SDKCore_DiffTracking } from './modules/diffTracking.js';
import { SDKCore_GET } from './modules/get.js';
import { SDKCore_INIT } from './modules/init.js';
import { SDKCore_MIDDLEWARES } from './modules/middlewares.js';
import { SDKCore_NotificationSettings } from './modules/notificationSettings.js';
import { SDKCore_POST } from './modules/post.js';
import { SDKCore_ResetTokenBucket } from './modules/resetTokenBucket.js';
import { SDKCore_REST_API } from './modules/rest_api.js';
import { SDKCore_UPDATE } from './modules/update.js';
import type {
	CacheMap,
	FolderListCacheObject,
	FolderTreeCacheObject,
	PageDataCacheObject,
	SiteConfigCacheObject,
	VersionCacheObject,
} from './types/index.js';
import { CacheContext } from './utils.js';

/**
 * A cache map that stores page data objects, indexed by their string keys.
 *
 * @remarks
 * This map is used to efficiently retrieve and store `PageDataCacheObject` instances,
 * allowing quick access to cached page data throughout the SDK.
 *
 * @typeParam string - The key representing the unique identifier for each page.
 * @typeParam PageDataCacheObject - The cached data object associated with each page.
 */
const pages: CacheMap<string, PageDataCacheObject> = new Map<string, PageDataCacheObject>();

/**
 * A cache map that stores site configuration objects, indexed by their string keys.
 *
 * @remarks
 * This map is used to efficiently retrieve and store `SiteConfigCacheObject` instances,
 * allowing quick access to cached site configurations throughout the SDK.
 *
 * @typeParam string - The key representing the unique identifier for each site configuration.
 * @typeParam SiteConfigCacheObject - The cached data object associated with each site configuration.
 */
const siteConfig: CacheMap<string, SiteConfigCacheObject> = new Map<
	string,
	SiteConfigCacheObject
>();

/**
 * A cache map that stores version objects, indexed by their string keys.
 *
 * @remarks
 * This map is used to efficiently retrieve and store `VersionCacheObject` instances,
 * allowing quick access to cached version data throughout the SDK.
 *
 * @typeParam string - The key representing the unique identifier for each version.
 * @typeParam VersionCacheObject - The cached data object associated with each version.
 */
const version: CacheMap<string, VersionCacheObject> = new Map<string, VersionCacheObject>();

/**
 * A cache map that stores folder tree objects, indexed by their string keys.
 *
 * @remarks
 * This map is used to efficiently retrieve and store `FolderTreeCacheObject` instances,
 * allowing quick access to cached folder tree structures throughout the SDK.
 *
 * @typeParam string - The key representing the unique identifier for each folder tree.
 * @typeParam FolderTreeCacheObject - The cached data object associated with each folder tree.
 */
const folderTree: CacheMap<string, FolderTreeCacheObject> = new Map<
	string,
	FolderTreeCacheObject
>();

/**
 * A cache map that stores page folder tree objects, indexed by their string keys.
 *
 * @remarks
 * This map is used to efficiently retrieve and store `FolderTreeCacheObject` instances
 * specifically for page folder structures, allowing quick access to cached page folder trees
 * throughout the SDK.
 *
 * @typeParam string - The key representing the unique identifier for each page folder tree.
 * @typeParam FolderTreeCacheObject - The cached data object associated with each page folder tree.
 */
const pageFolderTree: CacheMap<string, FolderTreeCacheObject> = new Map<
	string,
	FolderTreeCacheObject
>();

/**
 * A cache map that stores folder list objects, indexed by their string keys.
 *
 * @remarks
 * This map is used to efficiently retrieve and store `FolderListCacheObject` instances,
 * allowing quick access to cached folder lists throughout the SDK.
 *
 * @typeParam string - The key representing the unique identifier for each folder list.
 * @typeParam FolderListCacheObject - The cached data object associated with each folder list.
 */
const FolderList: CacheMap<string, FolderListCacheObject> = new Map<
	string,
	FolderListCacheObject
>();

/**
 * The `SDKCore` class serves as the central service aggregator for the StudioCMS SDK.
 * It extends `Effect.Service` and provides a unified interface to various sub-services
 * such as folder tree management, generators, parsers, user management, collectors,
 * database operations, REST API handlers, authentication, notification settings, and more.
 *
 * @remarks
 * - All dependencies are injected and made available through the service.
 * - The returned object from the effect contains all core SDK functions and sub-services.
 * - Static members `Provide` and `Cache` are available for effect provisioning and caching context.
 *
 * @example
 * ```typescript
 * const sdk = yield* Effect.service(SDKCore);
 * const pageData = yield* sdk.collectPageData(...);
 * ```
 *
 * @property {Function} Provide - Static method to provide the default SDKCore service.
 * @property {CacheContext} Cache - Static cache context for SDKCore-related data.
 *
 * @see Effect.Service
 * @see CacheContext
 */
export class SDKCore extends Effect.Service<SDKCore>()('studiocms/sdk/SDKCore', {
	dependencies: [
		SDKCore_FolderTree.Default,
		SDKCore_Generators.Default,
		SDKCore_Parsers.Default,
		SDKCore_Users.Default,
		SDKCore_Collectors.Default,
		SDKCore_CLEAR.Default,
		SDKCore_DELETE.Default,
		SDKCore_UPDATE.Default,
		SDKCore_POST.Default,
		SDKCore_REST_API.Default,
		SDKCore_GET.Default,
		SDKCore_ResetTokenBucket.Default,
		SDKCore_DiffTracking.Default,
		SDKCore_NotificationSettings.Default,
		SDKCore_AUTH.Default,
		SDKCore_INIT.Default,
		AstroDB.Default,
		SDKCore_MIDDLEWARES.Default,
	],
	effect: Effect.gen(function* () {
		// Get Services
		const [
			{
				getFullPath,
				findNodeByPath,
				findNodesAlongPath,
				findNodesAlongPathToId,
				findNodeById,
				addPageToFolderTree,
				buildFolderTree,
				getAvailableFolders,
			},
			{ generateRandomIDNumber, generateRandomPassword, generateToken, testToken },
			{ parseIdNumberArray, parseIdStringArray },
			{ combineRanks, verifyRank, clearUserReferences },
			{ collectCategories, collectTags, collectPageData, collectUserData },
			dbService,
			CLEAR,
			DELETE,
			UPDATE,
			POST,
			REST_API,
			GET,
			resetTokenBucket,
			diffTracking,
			notificationSettings,
			AUTH,
			INIT,
			MIDDLEWARES,
		] = yield* Effect.all([
			SDKCore_FolderTree,
			SDKCore_Generators,
			SDKCore_Parsers,
			SDKCore_Users,
			SDKCore_Collectors,
			AstroDB,
			SDKCore_CLEAR,
			SDKCore_DELETE,
			SDKCore_UPDATE,
			SDKCore_POST,
			SDKCore_REST_API,
			SDKCore_GET,
			SDKCore_ResetTokenBucket,
			SDKCore_DiffTracking,
			SDKCore_NotificationSettings,
			SDKCore_AUTH,
			SDKCore_INIT,
			SDKCore_MIDDLEWARES,
		]);

		// Breakout service functions that need to be returned in this.
		const { db } = dbService;

		return {
			db,
			dbService,
			getFullPath,
			findNodeByPath,
			findNodesAlongPath,
			findNodesAlongPathToId,
			findNodeById,
			addPageToFolderTree,
			generateRandomIDNumber,
			generateRandomPassword,
			generateToken,
			testToken,
			parseIdNumberArray,
			parseIdStringArray,
			combineRanks,
			verifyRank,
			buildFolderTree,
			getAvailableFolders,
			clearUserReferences,
			collectCategories,
			collectTags,
			collectPageData,
			collectUserData,
			resetTokenBucket,
			diffTracking,
			notificationSettings,
			CLEAR,
			DELETE,
			REST_API,
			POST,
			UPDATE,
			GET,
			AUTH,
			INIT,
			MIDDLEWARES,
		};
	}),
}) {
	/**
	 * Provides the default dependencies to an Effect.
	 *
	 * This static property uses `Effect.provide` with the default configuration (`this.Default`),
	 * allowing consumers to inject the standard dependencies required by the SDK core.
	 *
	 * @remarks
	 * Typically used to wrap effects that require the default environment or services.
	 *
	 * @see {@link Effect.provide}
	 * @see {@link Default}
	 */
	static Provide = Effect.provide(this.Default);
	/**
	 * Provides a static cache context containing various site-related data.
	 *
	 * @remarks
	 * The cache includes pages, folder lists, folder trees, page-folder trees,
	 * site configuration, and version information. It is created using
	 * `CacheContext.makeProvide` for efficient access throughout the SDK.
	 *
	 * @see CacheContext
	 * @see pages
	 * @see FolderList
	 * @see folderTree
	 * @see pageFolderTree
	 * @see siteConfig
	 * @see version
	 */
	static Cache = CacheContext.makeProvide({
		pages,
		FolderList,
		folderTree,
		pageFolderTree,
		siteConfig,
		version,
	});
}
