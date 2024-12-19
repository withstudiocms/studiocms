import { db } from 'astro:db';
import StudioCMSSDK from './StudioCMSSDK';
import type { STUDIOCMS_SDK_INIT } from './types';

const sdk = new StudioCMSSDK(db);

export const studioCMS_SDK_INIT: STUDIOCMS_SDK_INIT = sdk.INIT;

export default studioCMS_SDK_INIT;
