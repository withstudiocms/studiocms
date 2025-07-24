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

		const dispatchToProvider = <A, E, R>(
			context: APIContext,
			providers: {
				auth0: {
					enabled: boolean;
					handler: (context: APIContext) => Effect.Effect<A, E, R>;
				};
				discord: {
					enabled: boolean;
					handler: (context: APIContext) => Effect.Effect<A, E, R>;
				};
				github: {
					enabled: boolean;
					handler: (context: APIContext) => Effect.Effect<A, E, R>;
				};
				google: {
					enabled: boolean;
					handler: (context: APIContext) => Effect.Effect<A, E, R>;
				};
			}
		) =>
			genLogger('OAuthAPIEffect.dispatch')(function* () {
				switch (context.params.provider) {
					case Provider.AUTH0:
						if (!providers.auth0.enabled)
							return yield* ProviderResponse('Auth0 provider is not configured', 501);
						return yield* providers.auth0.handler(context);
					case Provider.DISCORD:
						if (!providers.discord.enabled)
							return yield* ProviderResponse('Discord provider is not configured', 501);
						return yield* providers.discord.handler(context);
					case Provider.GITHUB:
						if (!providers.github.enabled)
							return yield* ProviderResponse('GitHub provider is not configured', 501);
						return yield* providers.github.handler(context);
					case Provider.GOOGLE:
						if (!providers.google.enabled)
							return yield* ProviderResponse('Google provider is not configured', 501);
						return yield* providers.google.handler(context);
					default:
						return yield* ProviderResponse('Provider not implemented', 501);
				}
			});

		return {
			initSession: (context: APIContext) =>
				dispatchToProvider(context, {
					auth0: { enabled: auth0Enabled, handler: auth0InitSession },
					discord: { enabled: discordEnabled, handler: discordInitSession },
					github: { enabled: githubEnabled, handler: githubInitSession },
					google: { enabled: googleEnabled, handler: googleInitSession },
				}),
			initCallback: (context: APIContext) =>
				dispatchToProvider(context, {
					auth0: { enabled: auth0Enabled, handler: auth0InitCallback },
					discord: { enabled: discordEnabled, handler: discordInitCallback },
					github: { enabled: githubEnabled, handler: githubInitCallback },
					google: { enabled: googleEnabled, handler: googleInitCallback },
				}),
		};
	}),
}) {
	// Export Dependency Providers
	/**
	 * Main Dependencies Provider
	 */
	static Provide = Effect.provide(OAuthAPIEffect.Default);
	/**
	 * AuthEnvCheck Dependency Provider
	 *
	 * @param response authEnvCheck function response from `envChecker` Utility
	 * @returns Effect layer for OAuthAPIEffect
	 */
	static AuthEnvResponse = (response: AuthEnvCheckResponse) => AuthEnvCheck.Provide(response);

	// Export Utils
	/**
	 * EnvChecker - Check for required ENV Variables and if a provider should be enabled.
	 *
	 * @returns AuthEnvCheckResponse for usage with Dependency Provider "B"
	 */
	static envChecker = async () => Effect.runPromise(authEnvChecker());
}
