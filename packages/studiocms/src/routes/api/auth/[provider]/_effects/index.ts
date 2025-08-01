import { oAuthProviders } from 'studiocms:plugins/auth/providers';
import type { APIContext, APIRoute } from 'astro';
import { Effect, genLogger } from '../../../../../effect.js';
import { ProviderResponse } from './_shared.js';

/**
 * Executes the provided API route handler function with the given context and returns its resulting Promise.
 *
 * @param fn - The API route handler function to execute.
 * @param context - The context object to pass to the handler function.
 * @returns A Promise that resolves to a Response object returned by the handler.
 */
async function promisifyFn(fn: APIRoute, context: APIContext): Promise<Response> {
	return await fn(context);
}

/**
 * Wraps an API route handler function in an Effect, converting it into a promise-based effectful computation.
 *
 * @param fn - The API route handler function to be executed.
 * @param context - The API context to be passed to the handler.
 * @returns An Effect that resolves with the result of the handler or rejects with an error if execution fails.
 *
 * @remarks
 * If the handler throws an error, it is caught and wrapped in a new `Error` with a descriptive message.
 */
const promisify = Effect.fn(function* (fn: APIRoute, context: APIContext) {
	return yield* Effect.tryPromise({
		try: () => promisifyFn(fn, context),
		catch: (error) => new Error(`Failed to execute API route: ${error}`),
	});
});

/**
 * Dispatches an authentication request to the appropriate OAuth provider handler.
 *
 * This generator function locates the specified provider by its `safeName` from the provided list,
 * checks if the provider is enabled, and then invokes the appropriate handler (`initSession` or `initCallback`)
 * for the authentication flow. If the provider or handler is not found, or if the provider is not enabled,
 * it yields an appropriate error response.
 *
 * @param context - The API context containing request parameters and other relevant data.
 * @param handler - The handler to invoke, either `'initSession'` or `'initCallback'`.
 * @param providers - An array of provider configurations, each containing a `safeName`, `enabled` flag,
 *                    and optional `initSession` and `initCallback` route handlers.
 * @returns A generator yielding the result of the provider handler or an error response.
 */
const dispatchToAuthProvider = (
	context: APIContext,
	handler: 'initSession' | 'initCallback',
	providers: {
		safeName: string;
		enabled: boolean;
		initSession: APIRoute | null;
		initCallback: APIRoute | null;
	}[]
) =>
	genLogger('OAuthAPIEffect.dispatchToAuthProvider')(function* () {
		const provider = context.params.provider;
		const matchedProvider = providers.find((p) => p.safeName === provider);
		if (!matchedProvider) {
			return yield* ProviderResponse('Provider not found', 404);
		}
		if (!matchedProvider.enabled) {
			return yield* ProviderResponse('Provider is not configured', 403);
		}

		const handlerFn = matchedProvider[handler];

		if (!handlerFn) {
			return yield* ProviderResponse('Provider handler not found', 501);
		}

		return yield* promisify(handlerFn, context);
	});

export class OAuthAPIEffect extends Effect.Service<OAuthAPIEffect>()('OAuthAPIEffect', {
	effect: genLogger('studiocms/routes/api/auth/[provider]/_shared')(function* () {

		return {
			initSession: (context: APIContext) =>
				dispatchToAuthProvider(context, 'initSession', oAuthProviders),
			initCallback: (context: APIContext) =>
				dispatchToAuthProvider(context, 'initCallback', oAuthProviders),
		};
	}),
}) {
	// Export Dependency Providers
	/**
	 * Main Dependencies Provider
	 */
	static Provide = Effect.provide(OAuthAPIEffect.Default);
}
