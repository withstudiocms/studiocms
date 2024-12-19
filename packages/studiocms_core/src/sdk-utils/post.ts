import { db } from 'astro:db';
import StudioCMSSDK from './StudioCMSSDK';
import type { STUDIOCMS_SDK_POST } from './types';

const sdk = new StudioCMSSDK(db);

export const studioCMS_SDK_POST: STUDIOCMS_SDK_POST = sdk.POST;

export default studioCMS_SDK_POST;
