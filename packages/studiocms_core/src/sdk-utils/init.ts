import * as AstroDB from 'astro:db';
import type { STUDIOCMS_SDK } from 'studiocms:sdk/types';
import SDK from './StudioCMSSDK';

const sdkCore = new SDK(AstroDB);

export const studioCMS_SDK_INIT: STUDIOCMS_SDK['INIT'] = sdkCore.INIT;

export default studioCMS_SDK_INIT;
