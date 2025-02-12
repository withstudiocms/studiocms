import { and, asc, db, desc, eq } from 'astro:db';
import { getSecret } from 'astro:env/server';
import config from 'studiocms:config';
import SDK from './StudioCMSSDK.js';
import StudioCMSVirtualCache from './StudioCMSVirtualCache.js';
import type {
	PageDataCacheObject,
	STUDIOCMS_SDK_CACHE,
	SiteConfigCacheObject,
	VersionCacheObject,
} from './types/index.js';

export type { STUDIOCMS_SDK_CACHE, PageDataCacheObject, SiteConfigCacheObject, VersionCacheObject };

const { cacheConfig } = config.sdk;

const env = {
	CMS_ENCRYPTION_KEY: getSecret('CMS_ENCRYPTION_KEY'),
};

const sdkCore = new SDK({ eq, and, asc, db, desc }, env);

// Create the virtual cache
const VirtualCache = new StudioCMSVirtualCache(cacheConfig, sdkCore);

// Export the cache
export const studioCMS_SDK_Cache: STUDIOCMS_SDK_CACHE = VirtualCache.cacheModule;

export default studioCMS_SDK_Cache;
