import { studiocmsSDKCore } from './core.js';

/**
 * @deprecated
 */
const sdkCore = await studiocmsSDKCore();

/**
 * @deprecated
 */
export const studioCMS_SDK = sdkCore;

export default studioCMS_SDK;

/**
 * The new Effect-TS based SDK implementation that replaces the deprecated SDK.
 * This unified SDK merges the normal and cached SDK functionalities.
 */
export { SDKCore } from './sdkCore.js';
