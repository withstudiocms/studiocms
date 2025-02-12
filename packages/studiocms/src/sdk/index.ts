import * as AstroDB from 'astro:db';
import { getSecret } from 'astro:env/server';
import SDK from './StudioCMSSDK.js';
import type { STUDIOCMS_SDK } from './types/index.js';

const env = {
	CMS_ENCRYPTION_KEY: getSecret('CMS_ENCRYPTION_KEY'),
};

const sdkCore = new SDK(AstroDB, env);

export const studioCMS_SDK: STUDIOCMS_SDK = sdkCore;

export default studioCMS_SDK;

export { SDK as uninitializedStudioCMSSDK };
