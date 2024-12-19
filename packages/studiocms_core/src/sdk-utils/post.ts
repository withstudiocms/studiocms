import * as AstroDB from 'astro:db';
import SDK from './StudioCMSSDK';
import type { STUDIOCMS_SDK } from './types';

const sdkCore = new SDK(AstroDB);

export const studioCMS_SDK_POST: STUDIOCMS_SDK['POST'] = sdkCore.POST;

export default studioCMS_SDK_POST;
