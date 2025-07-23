import type { APIContext, APIRoute } from 'astro';
import { Effect, Layer, convertToVanilla, genLogger } from '../../../../effect.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';
import { Auth0OAuthAPI } from './_effects/auth0.js';
import { DiscordOAuthAPI } from './_effects/discord.js';
import { GitHubOAuthAPI } from './_effects/github.js';
import { GoogleOAuthAPI } from './_effects/google.js';
import { AuthAPIEffectDeps, Provider, ProviderResponse, authEnvChecker } from './_shared.js';

/**
 * Handles the GET request for OAuth authentication initialization for various providers.
 *
 * This route dynamically selects the appropriate OAuth provider (Google, GitHub, Discord, Auth0)
 * based on the `provider` parameter in the request context. It checks if the provider is enabled
 * in the authentication environment configuration before proceeding. If the provider is not enabled
 * or not implemented, it returns a 501 response with an appropriate message.
 *
 * @param context - The API request context containing route parameters and other request data.
 * @returns An API response from the selected provider's `initSession` method, or an error response if the provider is not configured or not implemented.
 */
export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/auth/[provider]/index.GET')(function* () {
			const [authEnv, google, github, discord, auth0] = yield* Effect.all([
				authEnvChecker(),
				GoogleOAuthAPI,
				GitHubOAuthAPI,
				DiscordOAuthAPI,
				Auth0OAuthAPI,
			]);

			// Call the appropriate provider function based on the provider and function
			switch (context.params.provider) {
				case Provider.GOOGLE: {
					if (!authEnv.GOOGLE.ENABLED)
						return ProviderResponse('Google provider is not configured', 501);

					return yield* google.initSession(context);
				}
				case Provider.GITHUB: {
					if (!authEnv.GITHUB.ENABLED)
						return ProviderResponse('GitHub provider is not configured', 501);

					return yield* github.initSession(context);
				}
				case Provider.DISCORD: {
					if (!authEnv.DISCORD.ENABLED)
						return ProviderResponse('Discord provider is not configured', 501);

					return yield* discord.initSession(context);
				}
				case Provider.AUTH0: {
					if (!authEnv.AUTH0.ENABLED)
						return ProviderResponse('Auth0 provider is not configured', 501);

					return yield* auth0.initSession(context);
				}
				default:
					return ProviderResponse('Provider not implemented', 501);
			}
		}).pipe(AuthAPIEffectDeps)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
