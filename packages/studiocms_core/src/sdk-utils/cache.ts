import { sdk } from 'studiocms:config';
import StudioCMSVirtualCache from './cache/StudioCMSVirtualCache';
import studioCMS_SDK from './index';
import type {
	PageDataCacheObject,
	STUDIOCMS_SDK_CACHE,
	SiteConfigCacheObject,
	VersionCacheObject,
} from './types';

export type { STUDIOCMS_SDK_CACHE, PageDataCacheObject, SiteConfigCacheObject, VersionCacheObject };

const { cacheConfig } = sdk;

// Create the virtual cache
const VirtualCache = new StudioCMSVirtualCache(cacheConfig, studioCMS_SDK);

// Export the cache
export const studioCMS_SDK_Cache: STUDIOCMS_SDK_CACHE = VirtualCache.cacheModule();

export default studioCMS_SDK_Cache;
