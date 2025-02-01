import * as AstroDB from 'astro:db';
import SDK from './StudioCMSSDK.js';
import type { STUDIOCMS_SDK } from './types/index.js';

const sdkCore = new SDK(AstroDB);

export const studioCMS_SDK_GET: STUDIOCMS_SDK['GET'] = sdkCore.GET;

export default studioCMS_SDK_GET;
