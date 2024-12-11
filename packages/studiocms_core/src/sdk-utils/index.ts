import studioCMS_SDK_AUTH from './auth';
import studioCMS_SDK_DELETE from './delete';
import studioCMS_SDK_GET from './get';
import studioCMS_SDK_POST from './post';
import type { STUDIOCMS_SDK } from './types';
import studioCMS_SDK_UPDATE from './update';

/**
 * ## The StudioCMS SDK
 *
 * The StudioCMS SDK provides a set of utility functions to interact with the StudioCMS database.
 *
 * @example
 * ```typescript
 * // Install and import the SDK `npm install @studiocms/core`
 * import StudioCMS_SDK from '@studiocms/core/sdk-utils';
 * // or using the virtual module (Included by default in StudioCMS)
 * import StudioCMS_SDK from 'studiocms:sdk';
 *
 * const users = await StudioCMS_SDK.GET.database.users();
 *
 * console.log(users);
 * ```
 */
export const studioCMS_SDK: STUDIOCMS_SDK = {
	GET: studioCMS_SDK_GET,
	POST: studioCMS_SDK_POST,
	UPDATE: studioCMS_SDK_UPDATE,
	DELETE: studioCMS_SDK_DELETE,
	AUTH: studioCMS_SDK_AUTH,
};

export default studioCMS_SDK;
