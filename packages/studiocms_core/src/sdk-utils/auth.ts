import { db } from 'astro:db';
import StudioCMSSDK from './StudioCMSSDK';
import type { STUDIOCMS_SDK_AUTH } from './types';

const sdk = new StudioCMSSDK(db);

export const studioCMS_SDK_AUTH: STUDIOCMS_SDK_AUTH = sdk.AUTH;

export default studioCMS_SDK_AUTH;
