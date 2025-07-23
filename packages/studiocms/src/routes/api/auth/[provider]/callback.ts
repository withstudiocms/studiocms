import type { APIContext, APIRoute } from 'astro';
import { Effect, Layer, convertToVanilla, genLogger } from '../../../../effect.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';
import { Auth0OAuthAPI } from './_effects/auth0.js';
import { DiscordOAuthAPI } from './_effects/discord.js';
import { GitHubOAuthAPI } from './_effects/github.js';
import { GoogleOAuthAPI } from './_effects/google.js';
import { Provider, ProviderResponse, authEnvChecker } from './_shared.js';

const deps = Layer.mergeAll(
	GoogleOAuthAPI.Default,
	GitHubOAuthAPI.Default,
	DiscordOAuthAPI.Default,
	Auth0OAuthAPI.Default
);

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/auth/[provider]/callback.GET')(function* () {
			const authEnv = yield* authEnvChecker();

			// Call the appropriate provider function based on the provider and function
			switch (context.params.provider) {
				case Provider.GOOGLE: {
					if (!authEnv.GOOGLE.ENABLED)
						return ProviderResponse('Google provider is not configured', 501);

					const google = yield* GoogleOAuthAPI;
					return yield* google.initCallback(context);
				}
				case Provider.GITHUB: {
					if (!authEnv.GITHUB.ENABLED)
						return ProviderResponse('GitHub provider is not configured', 501);

					const github = yield* GitHubOAuthAPI;
					return yield* github.initCallback(context);
				}
				case Provider.DISCORD: {
					if (!authEnv.DISCORD.ENABLED)
						return ProviderResponse('Discord provider is not configured', 501);

					const discord = yield* DiscordOAuthAPI;
					return yield* discord.initCallback(context);
				}
				case Provider.AUTH0: {
					if (!authEnv.AUTH0.ENABLED)
						return ProviderResponse('Auth0 provider is not configured', 501);

					const auth0 = yield* Auth0OAuthAPI;
					return yield* auth0.initCallback(context);
				}
				default:
					return ProviderResponse('Provider not implemented', 501);
			}
		}).pipe(Effect.provide(deps))
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
