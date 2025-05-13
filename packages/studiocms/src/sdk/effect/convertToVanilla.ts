import { Effect } from 'effect';

export function convertToVanilla<A, E>(effect: Effect.Effect<A, E, never>): A;
export function convertToVanilla<A, E>(effect: Effect.Effect<A, E, never>, async: true): Promise<A>;

/**
 * Converts an `Effect` into an object containing both synchronous and asynchronous execution methods.
 *
 * @template A - The type of the success value produced by the effect.
 * @template E - The type of the error value produced by the effect.
 *
 * @param effect - The `Effect` instance to be converted.
 * @returns An object with two properties:
 * - `sync`: The result of running the effect synchronously using `Effect.runSync`.
 * - `async`: A promise that resolves with the result of running the effect asynchronously using `Effect.runPromise`.
 */
export function convertToVanilla<A, E>(effect: Effect.Effect<A, E, never>, async = false) {
	if (async) return Effect.runPromise<A, E>(effect);
	return Effect.runSync<A, E>(effect);
}
