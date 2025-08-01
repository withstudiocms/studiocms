import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, Effect } from 'studiocms/effect';
import { Auth0OAuthAPI } from './effect/auth0.js';

/**
 * API route handler for initializing an Auth0 session.
 *
 * This function uses the Effect system to compose asynchronous operations,
 * retrieving the `initSession` method from the `Auth0OAuthAPI` and invoking it
 * with the provided API context. The result is converted to a vanilla response
 * using `convertToVanilla`.
 *
 * @param context - The API context containing request and environment information.
 * @returns A promise resolving to the API response after session initialization.
 */
export const initSession: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		Effect.gen(function* () {
			const { initSession } = yield* Auth0OAuthAPI;
			return yield* initSession(context);
		}).pipe(Effect.provide(Auth0OAuthAPI.Default))
	);

/**
 * Handles the Auth0 OAuth callback endpoint.
 *
 * This API route initializes the Auth0 OAuth callback process by invoking the `initCallback`
 * method from the `Auth0OAuthAPI`. It uses the Effect system to manage dependencies and
 * asynchronous control flow, providing the default implementation of `Auth0OAuthAPI`.
 *
 * @param context - The API context containing request and response objects.
 * @returns A promise resolving to the result of the Auth0 OAuth callback process.
 */
export const initCallback: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		Effect.gen(function* () {
			const { initCallback } = yield* Auth0OAuthAPI;
			return yield* initCallback(context);
		}).pipe(Effect.provide(Auth0OAuthAPI.Default))
	);
