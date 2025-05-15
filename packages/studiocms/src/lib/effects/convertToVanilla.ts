import { Effect } from 'effect';

/**
 * Converts an `Effect` into an object containing both synchronous and asynchronous execution methods.
 *
 * @template A - The type of the success value produced by the effect.
 * @template E - The type of the error value produced by the effect.
 *
 * @param effect - The `Effect` instance to be converted.
 */
export const convertToVanilla = async <A, E>(effect: Effect.Effect<A, E, never>) =>
	await Effect.runPromise<A, E>(effect);
