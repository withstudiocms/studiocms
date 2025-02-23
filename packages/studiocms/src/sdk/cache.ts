import config from 'studiocms:config';
import StudioCMSVirtualCache from './StudioCMSVirtualCache.js';
import { studiocmsSDKCore } from './core.js';
import type {
	PageDataCacheObject,
	STUDIOCMS_SDK_CACHE,
	SiteConfigCacheObject,
	VersionCacheObject,
} from './types/index.js';

export type { STUDIOCMS_SDK_CACHE, PageDataCacheObject, SiteConfigCacheObject, VersionCacheObject };

const { cacheConfig } = config.sdk;

/**
 * Initializes the core SDK for StudioCMS.
 *
 * This constant holds the instance of the StudioCMS SDK core, which provides
 * essential functionalities and services required by the StudioCMS application.
 *
 * @constant
 */
const sdkCore = studiocmsSDKCore();

/**
 * An instance of `StudioCMSVirtualCache` initialized with the provided
 * `cacheConfig` and `sdkCore`.
 *
 * This cache is used to store and retrieve data within the StudioCMS SDK.
 *
 * @constant {StudioCMSVirtualCache} VirtualCache - The virtual cache instance.
 * @param {CacheConfig} cacheConfig - The configuration settings for the cache.
 * @param {SDKCore} sdkCore - The core SDK instance used for initializing the cache.
 */
const VirtualCache = new StudioCMSVirtualCache(cacheConfig, sdkCore);

/**
 * A constant representing the StudioCMS SDK Cache.
 * This cache is used to store and retrieve data within the StudioCMS SDK.
 *
 * @constant
 * @type {STUDIOCMS_SDK_CACHE}
 */
export const studioCMS_SDK_Cache: STUDIOCMS_SDK_CACHE = VirtualCache.cacheModule;

export default studioCMS_SDK_Cache;
