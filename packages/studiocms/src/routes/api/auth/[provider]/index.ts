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
			const [
				{ initSession: auth0InitSession },
				{ initSession: discordInitSession },
				{ initSession: githubInitSession },
				{ initSession: googleInitSession },
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

					return yield* auth0InitSession(context);
				}
				case Provider.DISCORD: {
					if (!discordEnabled)
						return yield* ProviderResponse('Discord provider is not configured', 501);

					return yield* discordInitSession(context);
				}
				case Provider.GITHUB: {
					if (!githubEnabled)
						return yield* ProviderResponse('GitHub provider is not configured', 501);

					return yield* githubInitSession(context);
				}
				case Provider.GOOGLE: {
					if (!googleEnabled)
						return yield* ProviderResponse('Google provider is not configured', 501);

					return yield* googleInitSession(context);
				}
				default:
					return yield* ProviderResponse('Provider not implemented', 501);
			}
		}).pipe(AuthAPIEffectDeps, AuthEnvCheck.Provide(await AuthEnv()))
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
