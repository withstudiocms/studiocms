import type { APIContext, APIRoute } from 'astro';
import { Effect, runEffect } from 'studiocms/effect';
import { GitHubOAuthAPI } from './effect/github.js';

/**
 * API route handler for initializing a GitHub session.
 *
 * This function uses the Effect system to compose asynchronous operations,
 * retrieving the `initSession` method from the `GitHubOAuthAPI` and invoking it
 * with the provided API context. The result is converted to a vanilla response
 * using `runEffect`.
 *
 * @param context - The API context containing request and environment information.
 * @returns A promise resolving to the API response after session initialization.
 */
export const initSession: APIRoute = async (context: APIContext) =>
	await runEffect(
		Effect.gen(function* () {
			const { initSession } = yield* GitHubOAuthAPI;
			return yield* initSession(context);
		}).pipe(Effect.provide(GitHubOAuthAPI.Default))
	);

/**
 * Handles the GitHub OAuth callback endpoint.
 *
 * This API route initializes the GitHub OAuth callback process by invoking the `initCallback`
 * method from the `GitHubOAuthAPI`. It uses the Effect system to manage dependencies and
 * asynchronous control flow, providing the default implementation of `GitHubOAuthAPI`.
 *
 * @param context - The API context containing request and response objects.
 * @returns A promise resolving to the result of the GitHub OAuth callback process.
 */
export const initCallback: APIRoute = async (context: APIContext) =>
	await runEffect(
		Effect.gen(function* () {
			const { initCallback } = yield* GitHubOAuthAPI;
			return yield* initCallback(context);
		}).pipe(Effect.provide(GitHubOAuthAPI.Default))
	);
