import { Effect } from 'effect';
import { convertToVanilla } from '../lib/effects/index.js';
import { SDKCore as _SDKCore } from './sdkCore.js';

/**
 * The main Effect-TS based SDK implementation.
 * This unified SDK merges normal and cached SDK functionalities.
 *
 * @remarks
 * Use this as the entry point for all SDK operations. Provides access to all core features.
 *
 * @example
 * ```ts
 * import { Effect } from 'studiocms/effect';
 * import { SDKCore } from 'studiocms:sdk';
 *
 * const db = Effect.gen(function* () {
 *   const sdk = yield* SDKCore;
 *   return sdk.db;
 * });
 * ```
 */
export const SDKCore = Effect.gen(function* () {
	const core = yield* _SDKCore;
	return core;
}).pipe(_SDKCore.Provide, _SDKCore.Cache);

/**
 * Converts the `SDKCore` effect to a vanilla JavaScript object by removing the `_tag` property.
 *
 * @remarks
 * This function uses `Effect.gen` to yield the `SDKCore` effect, destructures the result to exclude the `_tag` property,
 * and then passes the remaining core properties to `convertToVanilla`.
 *
 * @returns A promise that resolves to the core properties of `SDKCore` as a plain JavaScript object.
 */
export const SDKCoreJs = await convertToVanilla(
	Effect.gen(function* () {
		const { _tag, ...core } = yield* SDKCore;
		return core;
	})
);

/**
 * Alias for `convertToVanilla`, used to run SDK effects and convert them to plain JavaScript objects.
 *
 * @param effect - The Effect to be converted.
 * @returns A promise that resolves to the plain JavaScript object representation of the effect's result.
 */
export const runSDK = convertToVanilla;
