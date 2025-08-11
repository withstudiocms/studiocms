import type { APIContext } from 'astro';
import { runEffect } from '../index.js';
import type { EffectAPIRouteHandler } from './types.js';

/**
 * Defines an API route handler using an effectful function.
 *
 * @param context - The API context provided to the route handler.
 * @returns An asynchronous function that takes a handler function `fn`, which receives the API context and returns an Effect.
 * The effect should resolve to either a `Response` or a `Promise<Response>`.
 * The returned function executes the effect and returns the resulting `Response`.
 *
 * @template _A - The type of the value produced by the effect (should be `Promise<Response>` or `Response`).
 * @template E - The type of error that may be produced by the effect.
 */
export const defineAPIRoute =
	(context: APIContext) =>
	async (fn: EffectAPIRouteHandler): Promise<Response> =>
		await runEffect(fn(context));
