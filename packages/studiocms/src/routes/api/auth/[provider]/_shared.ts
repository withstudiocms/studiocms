import { type AuthEnvCheckResponse, authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import { authConfig } from 'studiocms:config';
import type { APIContext } from 'astro';
import { Context, Data, Effect, Layer, genLogger } from '../../../../effect.js';
import { Auth0OAuthAPI } from './_effects/auth0.js';
import { DiscordOAuthAPI } from './_effects/discord.js';
import { GitHubOAuthAPI } from './_effects/github.js';
import { GoogleOAuthAPI } from './_effects/google.js';

/**
 * Enum representing supported authentication providers.
 *
 * @remarks
 * Used to specify the provider for authentication flows.
 *
 * @enum {string}
 * @property {Provider.GOOGLE}  Google authentication provider.
 * @property {Provider.GITHUB}  GitHub authentication provider.
 * @property {Provider.DISCORD} Discord authentication provider.
 * @property {Provider.AUTH0}   Auth0 authentication provider.
 */
export enum Provider {
	GOOGLE = 'google',
	GITHUB = 'github',
	DISCORD = 'discord',
	AUTH0 = 'auth0',
}

/**
 * Creates a standardized HTTP response for authentication provider errors.
 *
 * @param error - The error message to include in the response body.
 * @param status - The HTTP status code for the response.
 * @returns A `Response` object with a JSON body containing the error message and the specified status code.
 */
export const ProviderResponse = (
	error: string,
	status: number
): Effect.Effect<Response, never, never> =>
	Effect.succeed(new Response(JSON.stringify({ error }), { status }));

/**
 * Represents an error related to authentication environment configuration.
 *
 * This error is tagged as 'AuthEnvError' and includes a message describing the issue.
 *
 * @extends Data.TaggedError
 * @template { message: string } - The payload containing the error message.
 */
export class AuthEnvError extends Data.TaggedError('AuthEnvError')<{ message: string }> {}

/**
 * Checks the authentication environment configuration for all providers.
 *
 * This function wraps the `authEnvCheck` call in an `Effect.tryPromise`, handling any errors
 * by returning an `AuthEnvError` with a descriptive message.
 *
 * @returns {Effect<unknown, AuthEnvError, void>} An effect that resolves if the environment is valid,
 * or fails with an `AuthEnvError` if the check fails.
 */
export const authEnvChecker = (): Effect.Effect<AuthEnvCheckResponse, AuthEnvError, never> =>
	Effect.tryPromise({
		try: () => authEnvCheck(authConfig.providers),
		catch: (cause) =>
			new AuthEnvError({ message: `Authentication environment check failed: ${cause}` }),
	});

export class AuthEnvCheck extends Context.Tag('AuthEnvCheck')<
	AuthEnvCheck,
	AuthEnvCheckResponse
>() {
	static make = (response: AuthEnvCheckResponse) => Layer.succeed(this, this.of(response));
	static Provide = (response: AuthEnvCheckResponse) => Effect.provide(this.make(response));
}

export class ValidateAuthCodeError extends Data.TaggedError('ValidateAuthCodeError')<{
	message: string;
	provider: string;
}> {}

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
	static A = Effect.provide(OAuthAPIEffect.Default);
	static B = (response: AuthEnvCheckResponse) => AuthEnvCheck.Provide(response);
}
