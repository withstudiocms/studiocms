import type { APIContext, APIRoute } from 'astro';
import { Effect, Layer, convertToVanilla, genLogger } from '../../../../effect.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';
import { Auth0OAuthAPI } from './_effects/auth0.js';
import { DiscordOAuthAPI } from './_effects/discord.js';
import { GitHubOAuthAPI } from './_effects/github.js';
import { GoogleOAuthAPI } from './_effects/google.js';
import {
	AuthAPIEffectDeps,
	AuthEnvCheck,
	Provider,
	ProviderResponse,
	authEnvChecker,
} from './_shared.js';

export const AuthEnv = async () => await convertToVanilla(authEnvChecker());

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
			const [
				{ initCallback: auth0InitCallback },
				{ initCallback: discordInitCallback },
				{ initCallback: githubInitCallback },
				{ initCallback: googleInitCallback },
				{
					AUTH0: { ENABLED: auth0Enabled },
					DISCORD: { ENABLED: discordEnabled },
					GITHUB: { ENABLED: githubEnabled },
					GOOGLE: { ENABLED: googleEnabled },
				},
			] = yield* Effect.all([
				Auth0OAuthAPI,
				DiscordOAuthAPI,
				GitHubOAuthAPI,
				GoogleOAuthAPI,
				AuthEnvCheck,
			]);

			// Call the appropriate provider function based on the provider and function
			switch (context.params.provider) {
				case Provider.AUTH0: {
					if (!auth0Enabled)
						return yield* ProviderResponse('Auth0 provider is not configured', 501);

					return yield* auth0InitCallback(context);
				}
				case Provider.DISCORD: {
					if (!discordEnabled)
						return yield* ProviderResponse('Discord provider is not configured', 501);

					return yield* discordInitCallback(context);
				}
				case Provider.GITHUB: {
					if (!githubEnabled)
						return yield* ProviderResponse('GitHub provider is not configured', 501);

					return yield* githubInitCallback(context);
				}
				case Provider.GOOGLE: {
					if (!googleEnabled)
						return yield* ProviderResponse('Google provider is not configured', 501);

					return yield* googleInitCallback(context);
				}
				default:
					return yield* ProviderResponse('Provider not implemented', 501);
			}
		}).pipe(AuthAPIEffectDeps, AuthEnvCheck.Provide(await AuthEnv()))
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
