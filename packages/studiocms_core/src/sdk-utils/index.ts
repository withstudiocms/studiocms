import { db } from 'astro:db';
import StudioCMSSDK from './StudioCMSSDK';
import type { STUDIOCMS_SDK } from './types';

const sdkCore = new StudioCMSSDK(db);

export const studioCMS_SDK: STUDIOCMS_SDK = sdkCore;

export default studioCMS_SDK;
