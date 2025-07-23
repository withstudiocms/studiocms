import type { APIContext, APIRoute } from 'astro';
import { Effect, Layer, convertToVanilla, genLogger } from '../../../../effect.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';
import { Auth0OAuthAPI } from './_effects/auth0.js';
import { DiscordOAuthAPI } from './_effects/discord.js';
import { GitHubOAuthAPI } from './_effects/github.js';
import { GoogleOAuthAPI } from './_effects/google.js';
import { AuthAPIEffectDeps, Provider, ProviderResponse, authEnvChecker } from './_shared.js';

/**
 * Handles OAuth callback requests for various authentication providers.
 *
 * This route supports Google, GitHub, Discord, and Auth0 providers.
 * It checks if the requested provider is enabled in the authentication environment,
 * and delegates the callback handling to the corresponding provider's API.
 * If the provider is not configured or not implemented, it returns a 501 response.
 *
 * @param context - The API context containing request parameters and other metadata.
 * @returns The result of the provider's callback handler, or an error response if not configured or implemented.
 */
export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/auth/[provider]/callback.GET')(function* () {
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

					return yield* google.initCallback(context);
				}
				case Provider.GITHUB: {
					if (!authEnv.GITHUB.ENABLED)
						return ProviderResponse('GitHub provider is not configured', 501);

					return yield* github.initCallback(context);
				}
				case Provider.DISCORD: {
					if (!authEnv.DISCORD.ENABLED)
						return ProviderResponse('Discord provider is not configured', 501);

					return yield* discord.initCallback(context);
				}
				case Provider.AUTH0: {
					if (!authEnv.AUTH0.ENABLED)
						return ProviderResponse('Auth0 provider is not configured', 501);

					return yield* auth0.initCallback(context);
				}
				default:
					return ProviderResponse('Provider not implemented', 501);
			}
		}).pipe(AuthAPIEffectDeps)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
