import { db } from 'astro:db';
import type { STUDIOCMS_SDK } from 'studiocms:sdk/types';
import StudioCMSSDK from './StudioCMSSDK';

const sdkCore = new StudioCMSSDK(db);

export const studioCMS_SDK_INIT: STUDIOCMS_SDK['INIT'] = sdkCore.INIT;

export default studioCMS_SDK_INIT;
