import type { APIContext, APIRoute } from 'astro';
import { Effect, runEffect } from 'studiocms/effect';
import { GoogleOAuthAPI } from './effect/google.js';

/**
 * API route handler for initializing a Google session.
 *
 * This function uses the Effect system to compose asynchronous operations,
 * retrieving the `initSession` method from the `GoogleOAuthAPI` and invoking it
 * with the provided API context. The result is converted to a vanilla response
 * using `runEffect`.
 *
 * @param context - The API context containing request and environment information.
 * @returns A promise resolving to the API response after session initialization.
 */
export const initSession: APIRoute = async (context: APIContext) =>
	await runEffect(
		Effect.gen(function* () {
			const { initSession } = yield* GoogleOAuthAPI;
			return yield* initSession(context);
		}).pipe(Effect.provide(GoogleOAuthAPI.Default))
	);

/**
 * Handles the Google OAuth callback endpoint.
 *
 * This API route initializes the Google OAuth callback process by invoking the `initCallback`
 * method from the `GoogleOAuthAPI`. It uses the Effect system to manage dependencies and
 * asynchronous control flow, providing the default implementation of `GoogleOAuthAPI`.
 *
 * @param context - The API context containing request and response objects.
 * @returns A promise resolving to the result of the Google OAuth callback process.
 */
export const initCallback: APIRoute = async (context: APIContext) =>
	await runEffect(
		Effect.gen(function* () {
			const { initCallback } = yield* GoogleOAuthAPI;
			return yield* initCallback(context);
		}).pipe(Effect.provide(GoogleOAuthAPI.Default))
	);
