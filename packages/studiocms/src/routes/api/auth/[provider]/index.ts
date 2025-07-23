import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import { authConfig } from 'studiocms:config';
import type { APIContext, APIRoute } from 'astro';
import { Effect, Layer, convertToVanilla, genLogger } from '../../../../effect.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';
import { Auth0OAuthAPI } from './_effects/auth0.js';
import { DiscordOAuthAPI } from './_effects/discord.js';
import { GitHubOAuthAPI } from './_effects/github.js';
import { GoogleOAuthAPI } from './_effects/google.js';
import { Provider } from './_types.js';

const deps = Layer.mergeAll(
	GoogleOAuthAPI.Default,
	GitHubOAuthAPI.Default,
	DiscordOAuthAPI.Default,
	Auth0OAuthAPI.Default
);

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/auth/[provider]/index.GET')(function* () {
			const authEnv = yield* Effect.tryPromise(() => authEnvCheck(authConfig.providers));

			// Get the provider and function from the context params
			const { provider } = context.params;

			// Check if the provider is valid
			if (!provider) {
				return new Response(JSON.stringify({ error: 'Invalid provider' }), { status: 400 });
			}

			// Call the appropriate provider function based on the provider and function

			switch (provider) {
				case Provider.GOOGLE: {
					if (!authEnv.GOOGLE.ENABLED) {
						return new Response(JSON.stringify({ error: 'Google provider is not configured' }), {
							status: 501,
						});
					}

					const google = yield* GoogleOAuthAPI;
					return yield* google.initSession(context);
				}
				case Provider.GITHUB: {
					if (!authEnv.GITHUB.ENABLED) {
						return new Response(JSON.stringify({ error: 'GitHub provider is not configured' }), {
							status: 501,
						});
					}

					const github = yield* GitHubOAuthAPI;
					return yield* github.initSession(context);
				}
				case Provider.DISCORD: {
					if (!authEnv.DISCORD.ENABLED) {
						return new Response(JSON.stringify({ error: 'Discord provider is not configured' }), {
							status: 501,
						});
					}

					const discord = yield* DiscordOAuthAPI;
					return yield* discord.initSession(context);
				}
				case Provider.AUTH0: {
					if (!authEnv.AUTH0.ENABLED) {
						return new Response(JSON.stringify({ error: 'Auth0 provider is not configured' }), {
							status: 501,
						});
					}

					const auth0 = yield* Auth0OAuthAPI;
					return yield* auth0.initSession(context);
				}
				default: {
					return new Response(JSON.stringify({ error: 'Provider not implemented' }), {
						status: 501,
					});
				}
			}
		}).pipe(Effect.provide(deps))
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
