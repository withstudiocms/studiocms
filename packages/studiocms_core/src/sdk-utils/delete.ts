import { db } from 'astro:db';
import StudioCMSSDK from './StudioCMSSDK';
import type { STUDIOCMS_SDK_DELETE } from './types';

const sdk = new StudioCMSSDK(db);

export const studioCMS_SDK_DELETE: STUDIOCMS_SDK_DELETE = sdk.DELETE;

export default studioCMS_SDK_DELETE;
