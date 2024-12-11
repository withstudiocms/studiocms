import StudioCMS_SDK_DELETE from './delete';
import StudioCMS_SDK_GET from './get';
import StudioCMS_SDK_POST from './post';
import type { STUDIOCMS_SDK } from './types';
import StudioCMS_SDK_UPDATE from './update';

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
export const StudioCMS_SDK: STUDIOCMS_SDK = {
	GET: StudioCMS_SDK_GET,
	POST: StudioCMS_SDK_POST,
	UPDATE: StudioCMS_SDK_UPDATE,
	DELETE: StudioCMS_SDK_DELETE,
};

export default StudioCMS_SDK;
