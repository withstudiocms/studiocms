import {
	deepmergeCustom as _deepmergeCustomSrc,
	type deepmerge as _deepmergeSrc,
	type DeepMergeBuiltInMetaData,
	type DeepMergeOptions,
} from 'deepmerge-ts';
import { Effect } from './effect.js';

/**
 * Provides a custom deep merge utility within an Effect context.
 *
 * This function wraps a callback that receives the internal `_deepmergeCustom` function,
 * executing it within an Effect, and handling any thrown errors by wrapping them in a new Error
 * with a descriptive message.
 *
 * @typeParam T - The return type of the callback function.
 * @param fn - A callback function that receives the `_deepmergeCustom` function and returns a value of type `T`.
 * @returns An Effect that attempts to execute the callback and captures any errors.
 */
export const deepmergeCustom = Effect.fn(<T>(fn: (deepmerge: typeof _deepmergeCustomSrc) => T) =>
	Effect.try({
		try: () => fn(_deepmergeCustomSrc),
		catch: (cause) =>
			new Error(
				`Failed to run deepmerge callback: ${cause instanceof Error ? cause.message : String(cause)}`
			),
	})
);

/**
 * Runs a function with a custom deepmerge implementation within an Effect context.
 *
 * @template T The return type of the provided function.
 * @param fn - A function that receives the custom deepmerge function and returns a value of type T.
 * @param opts - Optional deep merge options to customize the merging behavior.
 * @returns An Effect that yields the result of the provided function or throws an error if the operation fails.
 *
 * @example
 * ```typescript
 * const result = yield* deepmerge((merge) => merge(obj1, obj2));
 * ```
 */
export const deepmerge = Effect.fn(function* <T>(
	fn: (deepmerge: typeof _deepmergeSrc) => T,
	opts: DeepMergeOptions<DeepMergeBuiltInMetaData, DeepMergeBuiltInMetaData> = {}
) {
	const _deepmerge = yield* deepmergeCustom((merge) => merge(opts));

	return yield* Effect.try({
		try: () => fn(_deepmerge),
		catch: (cause) =>
			new Error(
				`Failed to run deepmerge: ${cause instanceof Error ? cause.message : String(cause)}`
			),
	});
});
