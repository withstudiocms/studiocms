import { db } from 'astro:db';
import StudioCMSSDK from './StudioCMSSDK';
import type { STUDIOCMS_SDK } from './types';

const sdkCore = new StudioCMSSDK(db);

export const studioCMS_SDK_UPDATE: STUDIOCMS_SDK['UPDATE'] = sdkCore.UPDATE;

export default studioCMS_SDK_UPDATE;
