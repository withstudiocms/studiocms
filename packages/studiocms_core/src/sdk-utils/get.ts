import { db } from 'astro:db';
import StudioCMSSDK from './StudioCMSSDK';
import type { STUDIOCMS_SDK_GET } from './types';

const sdk = new StudioCMSSDK(db);

export const studioCMS_SDK_GET: STUDIOCMS_SDK_GET = sdk.GET;

export default studioCMS_SDK_GET;
