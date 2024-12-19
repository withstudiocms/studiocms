import { db } from 'astro:db';
import StudioCMSSDK from './StudioCMSSDK';
import type { STUDIOCMS_SDK } from './types';

const sdkCore = new StudioCMSSDK(db);

export const studioCMS_SDK_GET: STUDIOCMS_SDK['GET'] = sdkCore.GET;

export default studioCMS_SDK_GET;
