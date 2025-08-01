import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, Effect } from 'studiocms/effect';
import { DiscordOAuthAPI } from './effect/discord.js';

/**
 * API route handler for initializing a Discord session.
 *
 * This function uses the Effect system to compose asynchronous operations,
 * retrieving the `initSession` method from the `DiscordOAuthAPI` and invoking it
 * with the provided API context. The result is converted to a vanilla response
 * using `convertToVanilla`.
 *
 * @param context - The API context containing request and environment information.
 * @returns A promise resolving to the API response after session initialization.
 */
export const initSession: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		Effect.gen(function* () {
			const { initSession } = yield* DiscordOAuthAPI;
			return yield* initSession(context);
		}).pipe(Effect.provide(DiscordOAuthAPI.Default))
	);

/**
 * Handles the Discord OAuth callback endpoint.
 *
 * This API route initializes the Discord OAuth callback process by invoking the `initCallback`
 * method from the `DiscordOAuthAPI`. It uses the Effect system to manage dependencies and
 * asynchronous control flow, providing the default implementation of `DiscordOAuthAPI`.
 *
 * @param context - The API context containing request and response objects.
 * @returns A promise resolving to the result of the Discord OAuth callback process.
 */
export const initCallback: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		Effect.gen(function* () {
			const { initCallback } = yield* DiscordOAuthAPI;
			return yield* initCallback(context);
		}).pipe(Effect.provide(DiscordOAuthAPI.Default))
	);
