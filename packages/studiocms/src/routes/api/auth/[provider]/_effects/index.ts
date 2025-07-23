import type { AuthEnvCheckResponse } from 'studiocms:auth/utils/authEnvCheck';
import type { APIContext } from 'astro';
import { Effect, genLogger } from '../../../../../effect.js';
import { AuthEnvCheck, Provider, ProviderResponse, authEnvChecker } from './_shared.js';
import { Auth0OAuthAPI } from './auth0.js';
import { DiscordOAuthAPI } from './discord.js';
import { GitHubOAuthAPI } from './github.js';
import { GoogleOAuthAPI } from './google.js';

export class OAuthAPIEffect extends Effect.Service<OAuthAPIEffect>()('OAuthAPIEffect', {
	dependencies: [
		Auth0OAuthAPI.Default,
		DiscordOAuthAPI.Default,
		GitHubOAuthAPI.Default,
		GoogleOAuthAPI.Default,
	],
	effect: genLogger('studiocms/routes/api/auth/[provider]/_shared')(function* () {
		const [
			{ initCallback: auth0InitCallback, initSession: auth0InitSession },
			{ initCallback: discordInitCallback, initSession: discordInitSession },
			{ initCallback: githubInitCallback, initSession: githubInitSession },
			{ initCallback: googleInitCallback, initSession: googleInitSession },
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

		return {
			initSession: (context: APIContext) =>
				genLogger('OAuthAPIEffect.initSession')(function* () {
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
				}),
			initCallback: (context: APIContext) =>
				genLogger('OAuthAPIEffect.initCallback')(function* () {
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
				}),
		};
	}),
}) {
    // Export Dependency Providers
    /**
     * Main Dependencies Provider
     */
	static A = Effect.provide(OAuthAPIEffect.Default);
    /**
     * AuthEnvCheck Dependency Provider
     * 
     * @param response authEnvCheck function response from `envChecker` Utility
     * @returns Effect layer for OAuthAPIEffect
     */
	static B = (response: AuthEnvCheckResponse) => AuthEnvCheck.Provide(response);

    // Export Utils
    /**
     * EnvChecker - Check for required ENV Variables and if a provider should be enabled.
     * 
     * @returns AuthEnvCheckResponse for usage with Dependency Provider "B"
     */
    static envChecker = async () => Effect.runPromise(authEnvChecker());
}
