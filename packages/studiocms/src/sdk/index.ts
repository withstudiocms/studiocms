import { studiocmsSDKCore } from './core.js';

/**
 * Initializes the core functionality of the StudioCMS SDK.
 *
 * @constant
 */
const sdkCore = studiocmsSDKCore();

/**
 * The main SDK export for StudioCMS.
 *
 * This constant provides access to the core functionality of the StudioCMS SDK.
 */
export const studioCMS_SDK = sdkCore;

export default studioCMS_SDK;

export { SDKCore } from './sdkCore.js';
