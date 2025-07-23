import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import { authConfig } from 'studiocms:config';
import { Data, Effect } from 'effect';

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
export const ProviderResponse = (error: string, status: number) =>
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

export const authEnvChecker = () => Effect.tryPromise({
	try: () => authEnvCheck(authConfig.providers),
	catch: (cause) =>
		new AuthEnvError({ message: `Authentication environment check failed: ${cause}` }),
});
