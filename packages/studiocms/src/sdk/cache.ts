import { cacheModule } from './cache-core.js';
import type {
	PageDataCacheObject,
	STUDIOCMS_SDK_CACHE,
	SiteConfigCacheObject,
	VersionCacheObject,
} from './types/index.js';

export type { STUDIOCMS_SDK_CACHE, PageDataCacheObject, SiteConfigCacheObject, VersionCacheObject };

/**
 * @deprecated Use SDKCore from 'studiocms:sdk' instead, which provides unified effect-based cache functionality.
 */
export const studioCMS_SDK_Cache: STUDIOCMS_SDK_CACHE = cacheModule;

export default studioCMS_SDK_Cache;
