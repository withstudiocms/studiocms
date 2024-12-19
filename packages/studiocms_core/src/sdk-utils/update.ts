import { db } from 'astro:db';
import StudioCMSSDK from './StudioCMSSDK';
import type { STUDIOCMS_SDK_UPDATE } from './types';

const sdk = new StudioCMSSDK(db);

export const studioCMS_SDK_UPDATE: STUDIOCMS_SDK_UPDATE = sdk.UPDATE;

export default studioCMS_SDK_UPDATE;
