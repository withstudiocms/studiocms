import StudioCMS_SDK_GET from './get';
import StudioCMS_SDK_POST from './post';
import type { STUDIOCMS_SDK } from './types';

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
	UPDATE: {},
	DELETE: {},
};

export default StudioCMS_SDK;
