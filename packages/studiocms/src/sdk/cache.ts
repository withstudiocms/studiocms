import { cacheModule } from './cache-core.js';
import type {
	PageDataCacheObject,
	STUDIOCMS_SDK_CACHE,
	SiteConfigCacheObject,
	VersionCacheObject,
} from './types/index.js';

export type { STUDIOCMS_SDK_CACHE, PageDataCacheObject, SiteConfigCacheObject, VersionCacheObject };

/**
 * A constant representing the StudioCMS SDK Cache.
 * This cache is used to store and retrieve data within the StudioCMS SDK.
 *
 * @constant
 * @type {STUDIOCMS_SDK_CACHE}
 */
export const studioCMS_SDK_Cache: STUDIOCMS_SDK_CACHE = cacheModule;

export default studioCMS_SDK_Cache;
