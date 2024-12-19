import * as AstroDB from 'astro:db';
import { sdk } from 'studiocms:config';
import SDK from './StudioCMSSDK';
import StudioCMSVirtualCache from './StudioCMSVirtualCache';
import type {
	PageDataCacheObject,
	STUDIOCMS_SDK_CACHE,
	SiteConfigCacheObject,
	VersionCacheObject,
} from './types';

export type { STUDIOCMS_SDK_CACHE, PageDataCacheObject, SiteConfigCacheObject, VersionCacheObject };

const { cacheConfig } = sdk;

const sdkCore = new SDK(AstroDB);

// Create the virtual cache
const VirtualCache = new StudioCMSVirtualCache(cacheConfig, sdkCore);

// Export the cache
export const studioCMS_SDK_Cache: STUDIOCMS_SDK_CACHE = VirtualCache.cacheModule;

export default studioCMS_SDK_Cache;
