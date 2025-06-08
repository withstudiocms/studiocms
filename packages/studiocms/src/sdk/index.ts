import { Effect } from 'effect';
import { convertToVanilla } from '../lib/effects/index.js';
import { studiocmsSDKCore } from './core.js';
import { SDKCore } from './sdkCore.js';

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
 *
 * @example
 * ```ts
 * import { Effect } from 'studiocms/effect';
 * import { SDKCore } from 'studiocms:sdk';
 *
 * const db = Effect.gen(function* () {
 *   const sdk = yield* SDKCore;
 *
 *   return sdk.db;
 * }).pipe(Effect.provide(SDKCore.Default));
 * ```
 */
export { SDKCore };

/**
 * VanillaJS Version of the SDKCore. Most internal functions will still contain Effects, you can use `runSDK` from the 'studiocms:sdk` to run these as normal async functions
 *
 * @example
 * ```ts
 * import { SDKCoreJs, runSDK } from 'studiocms:sdk';
 *
 * const pages = await runSDK(SDKCoreJs.GET.pages());
 * ```
 */
export const SDKCoreJs = await convertToVanilla(
	Effect.gen(function* () {
		const { _tag, ...core } = yield* SDKCore;
		return core;
	}).pipe(Effect.provide(SDKCore.Default))
);

/**
 * Utility function for running components of the SDKCoreJs
 *
 * @example
 * ```ts
 * import { SDKCoreJs, runSDK } from 'studiocms:sdk';
 *
 * const pages = await runSDK(SDKCoreJs.GET.pages());
 * ```
 */
export const runSDK = convertToVanilla;
