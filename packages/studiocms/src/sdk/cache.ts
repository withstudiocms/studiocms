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

const sdkCore = studiocmsSDKCore();

// Create the virtual cache
const VirtualCache = new StudioCMSVirtualCache(cacheConfig, sdkCore);

// Export the cache
export const studioCMS_SDK_Cache: STUDIOCMS_SDK_CACHE = VirtualCache.cacheModule;

export default studioCMS_SDK_Cache;
