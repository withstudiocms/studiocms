import { type AuthEnvCheckResponse, authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import { authConfig } from 'studiocms:config';
import { Data, Effect, Layer } from '../../../../effect.js';
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
export const ProviderResponse = (error: string, status: number): Response =>
	new Response(JSON.stringify({ error }), { status });

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

/**
 * Provides the dependencies required for authentication API effects by merging
 * the default layers for multiple OAuth providers: Google, GitHub, Discord, and Auth0.
 *
 * This allows authentication-related effects to access the necessary APIs for each provider.
 */
export const AuthAPIEffectDeps = Effect.provide(
	Layer.mergeAll(
		GoogleOAuthAPI.Default,
		GitHubOAuthAPI.Default,
		DiscordOAuthAPI.Default,
		Auth0OAuthAPI.Default
	)
);

export class ValidateAuthCodeError extends Data.TaggedError('ValidateAuthCodeError')<{ message: string, provider: string }> {}