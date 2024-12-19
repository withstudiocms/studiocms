import { db } from 'astro:db';
import StudioCMSSDK from './StudioCMSSDK';
import type { STUDIOCMS_SDK } from './types';

const sdk = new StudioCMSSDK(db);

export const studioCMS_SDK: STUDIOCMS_SDK = sdk;

export default studioCMS_SDK;
