import { sdk } from 'studiocms:config';
import { CMSSiteConfigId, versionCacheLifetime } from '../consts';
import StudioCMSVirtualCache from './cache/StudioCMSVirtualCache';
import studioCMS_SDK from './index';
import type {
	PageDataCacheObject,
	STUDIOCMS_SDK_CACHE,
	SiteConfigCacheObject,
	VersionCacheObject,
} from './types';

export type { STUDIOCMS_SDK_CACHE, PageDataCacheObject, SiteConfigCacheObject, VersionCacheObject };

// Create the virtual cache
const VirtualCache = new StudioCMSVirtualCache(
	new Map(),
	new Map(),
	new Map(),
	sdk.cacheConfig,
	studioCMS_SDK,
	CMSSiteConfigId,
	versionCacheLifetime
);

// Export the cache
export const studioCMS_SDK_Cache: STUDIOCMS_SDK_CACHE = VirtualCache.cacheModule();

export default studioCMS_SDK_Cache;
