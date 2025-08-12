import { type Effect, runEffect } from '@withstudiocms/effect';

/**
 * Converts an `Effect` into an object containing both synchronous and asynchronous execution methods.
 *
 * @template A - The type of the success value produced by the effect.
 * @template E - The type of the error value produced by the effect.
 *
 * @param effect - The `Effect` instance to be converted.
 *
 * @deprecated Use `runEffect` directly instead of wrapping it in `convertToVanilla`.
 */
export const convertToVanilla = <A, E>(effect: Effect.Effect<A, E, never>) => runEffect(effect);
