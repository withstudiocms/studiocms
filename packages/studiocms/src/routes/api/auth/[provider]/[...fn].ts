import type { APIContext, APIRoute } from 'astro';
import { Effect, Layer, convertToVanilla, genLogger } from '../../../../effect.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';
import { Auth0OAuthAPI } from '../auth0/effect.js';
import { DiscordOAuthAPI } from '../discord/effect.js';
import { GitHubOAuthAPI } from '../github/effect.js';
import { GoogleOAuthAPI } from '../google/effect.js';

const deps = Layer.mergeAll(
	GoogleOAuthAPI.Default,
	GitHubOAuthAPI.Default,
	DiscordOAuthAPI.Default,
	Auth0OAuthAPI.Default
);

const supportedProviders = ['google', 'github', 'discord', 'auth0'];

enum ProviderFunction {
    INIT_SESSION = 'initSession',
    INIT_CALLBACK = 'initCallback',
}

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/auth/[provider]/[...fn].GET')(function* () {
			// Get the provider and function from the context params
			const { provider, fn } = context.params;

            let action: ProviderFunction;

            // Check if the provider is valid
            if (!provider || !supportedProviders.includes(provider)) {
                return new Response(JSON.stringify({ error: 'Invalid provider' }), { status: 400 });
            }

            if (fn === undefined || fn === 'index') {
                action = ProviderFunction.INIT_SESSION;
            }

            else if (fn === 'callback') {
                action = ProviderFunction.INIT_CALLBACK;
            } else {
                return new Response(JSON.stringify({ error: 'Invalid endpoint' }), { status: 400 });
            }
            
            // Call the appropriate provider function based on the provider and function

            switch (provider) {
                case 'google': {
                    const google = yield* GoogleOAuthAPI;
                    switch (action) {
                        case ProviderFunction.INIT_SESSION: {
                            return yield* google.initSession(context);
                        }
                        case ProviderFunction.INIT_CALLBACK: {
                            return yield* google.initCallback(context);
                        }
                        default: {
                            return new Response(JSON.stringify({ error: 'Invalid action for Google provider' }), { status: 400 });
                        }
                    }
                }
                case 'github': {
			        const github = yield* GitHubOAuthAPI;
                    switch (action) {
                        case ProviderFunction.INIT_SESSION: {
                            return yield* github.initSession(context);
                        }
                        case ProviderFunction.INIT_CALLBACK: {
                            return yield* github.initCallback(context);
                        }
                        default: {
                            return new Response(JSON.stringify({ error: 'Invalid action for GitHub provider' }), { status: 400 });
                        }
                    }
                }
                case 'discord': {
			        const discord = yield* DiscordOAuthAPI;
                    switch (action) {
                        case ProviderFunction.INIT_SESSION: {
                            return yield* discord.initSession(context);
                        }
                        case ProviderFunction.INIT_CALLBACK: {
                            return yield* discord.initCallback(context);
                        }
                        default: {
                            return new Response(JSON.stringify({ error: 'Invalid action for Discord provider' }), { status: 400 });
                        }
                    }
                }
                case 'auth0': {
			        const auth0 = yield* Auth0OAuthAPI;
                    switch (action) {
                        case ProviderFunction.INIT_SESSION: {
                            return yield* auth0.initSession(context);
                        }
                        case ProviderFunction.INIT_CALLBACK: {
                            return yield* auth0.initCallback(context);
                        }
                        default: {
                            return new Response(JSON.stringify({ error: 'Invalid action for Auth0 provider' }), { status: 400 });
                        }
                    }
                }
                default: {
                    return new Response(JSON.stringify({ error: 'Provider not implemented' }), { status: 501 });
                }
            }

		}).pipe(Effect.provide(deps))
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
