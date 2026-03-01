import { oAuthProviders } from 'studiocms:plugins/auth/providers';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { NotFound } from '@effect/platform/HttpApiError';
import { StudioCMSAuthApi } from '@withstudiocms/api-spec';
import { AuthAPIError } from '@withstudiocms/api-spec/auth';
import { Effect } from 'effect';
import { AstroAPIContext } from 'effectify/astro/context';
import { ResponseToHttpServerResponse } from 'effectify/webHandler';

const authEnabled = routeConfig.dashboardEnabled;
const oAuthEnabled = routeConfig.oAuthEnabled;

/**
 * OAuth API Handler for managing OAuth authentication flows, including initiating OAuth sessions and handling OAuth callbacks.
 */
export const OAuthAPIHandler = HttpApiBuilder.group(StudioCMSAuthApi, 'oauth', (handlers) =>
	handlers
		.handle(
			'oAuthInit',
			Effect.fn(function* ({ path: { provider } }) {
				// If auth or oAuth is not enabled, return a 404 to avoid exposing the existence of the endpoint
				if (!authEnabled || !oAuthEnabled) {
					return yield* new NotFound();
				}

				// Find the provider configuration based on the provider name in the path parameters.
				const matchedProvider = oAuthProviders.find((p) => p.safeName === provider);

				// If the provider is not found, not enabled, or does not have an initSession handler, return a 404 to avoid exposing the existence of the endpoint or the provider.
				if (!matchedProvider || !matchedProvider.enabled || !matchedProvider.initSession) {
					return yield* new NotFound();
				}

				// Get the API context to pass to the provider handler, which may need it to access request information, cookies, etc.
				const ctx = yield* AstroAPIContext;

				// Call the provider's initSession handler to start the OAuth flow. This will typically redirect the user to the provider's authentication page. We wrap this in a try-catch to handle any errors that may occur during the provider handler execution and return a generic error message to prevent exposing sensitive information about the failure.
				const res = yield* Effect.tryPromise(async () => matchedProvider.initSession?.(ctx)).pipe(
					Effect.catchAll((error) => {
						console.error('API Error:', error);
						return new AuthAPIError({ error: 'Internal Server Error' });
					})
				);

				// If the provider handler did not return a response, return an error indicating that the OAuth session initialization failed.
				if (!res) {
					return yield* new AuthAPIError({ error: 'Failed to initialize OAuth session' });
				}

				// Convert the provider handler's response to an HTTP server response that can be returned to the client. This will typically be a redirect response to the provider's authentication page.
				return yield* ResponseToHttpServerResponse(res);
			})
		)
		.handle(
			'oAuthCallback',
			Effect.fn(function* ({ path: { provider } }) {
				// If auth or oAuth is not enabled, return a 404 to avoid exposing the existence of the endpoint
				if (!authEnabled || !oAuthEnabled) {
					return yield* new NotFound();
				}

				// Find the provider configuration based on the provider name in the path parameters.
				const matchedProvider = oAuthProviders.find((p) => p.safeName === provider);

				// If the provider is not found, not enabled, or does not have an initCallback handler, return a 404 to avoid exposing the existence of the endpoint or the provider.
				if (!matchedProvider || !matchedProvider.enabled || !matchedProvider.initCallback) {
					return yield* new NotFound();
				}

				// Get the API context to pass to the provider handler, which may need it to access request information, cookies, etc.
				const ctx = yield* AstroAPIContext;

				// Call the provider's initCallback handler to complete the OAuth flow. This will typically handle the callback from the provider after the user has authenticated and create a session for the user in the system. We wrap this in a try-catch to handle any errors that may occur during the provider handler execution and return a generic error message to prevent exposing sensitive information about the failure.
				const res = yield* Effect.tryPromise(async () => matchedProvider.initCallback?.(ctx)).pipe(
					Effect.catchAll((error) => {
						console.error('API Error:', error);
						return new AuthAPIError({ error: 'Internal Server Error' });
					})
				);

				// If the provider handler did not return a response, return an error indicating that the OAuth callback initialization failed.
				if (!res) {
					return yield* new AuthAPIError({ error: 'Failed to initialize OAuth callback' });
				}

				// Convert the provider handler's response to an HTTP server response that can be returned to the client. This will typically be a redirect response to the main site or dashboard after successful authentication.
				return yield* ResponseToHttpServerResponse(res);
			})
		)
);
