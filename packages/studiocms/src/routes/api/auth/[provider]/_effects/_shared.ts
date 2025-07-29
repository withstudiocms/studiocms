import { type AuthEnvCheckResponse, authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import { authConfig } from 'studiocms:config';
import type { APIContext } from 'astro';
import { AstroError } from 'astro/errors';
import { Context, Data, Effect, Layer, pipe, Schema } from '../../../../../effect.js';

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

export const getUrlParam = ({ url }: APIContext, name: string) =>
	Effect.try({
		try: () => url.searchParams.get(name),
		catch: () => new AstroError('Failed to parse URL from Astro context'),
	});

export const getCookie = ({ cookies }: APIContext, key: string) =>
	Effect.try({
		try: () => cookies.get(key)?.value ?? null,
		catch: () => new AstroError('Failed to parse get Cookies from Astro context'),
	});

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

/**
 * Represents a user authenticated via Auth0.
 *
 * @property {string} sub - The unique identifier for the user (subject).
 * @property {string} name - The full name of the user.
 * @property {string} email - The email address of the user.
 * @property {string} picture - The URL to the user's profile picture.
 * @property {string} nickname - The user's nickname.
 */
export class Auth0User extends Schema.Class<Auth0User>('Auth0User')({
	sub: Schema.String,
	name: Schema.String,
	email: Schema.String,
	picture: Schema.String,
	nickname: Schema.String,
}) {}

/**
 * Represents a Discord user's profile information.
 *
 * @property id - The unique identifier for the Discord user.
 * @property avatar - The user's avatar hash.
 * @property username - The user's Discord username.
 * @property global_name - The user's global display name.
 * @property email - The user's email address.
 */
export class DiscordUser extends Schema.Class<DiscordUser>('DiscordUser')({
	id: Schema.String,
	avatar: Schema.String,
	username: Schema.String,
	global_name: Schema.String,
	email: Schema.String,
}) {}

/**
 * Represents a GitHub user profile as returned by the GitHub API.
 *
 * @property id - The unique identifier for the user.
 * @property html_url - The URL to the user's GitHub profile.
 * @property login - The user's GitHub username.
 * @property avatar_url - The URL to the user's avatar image.
 * @property name - The user's display name.
 * @property blog - The user's blog URL.
 * @property email - The user's public email address.
 */
export class GitHubUser extends Schema.Class<GitHubUser>('GitHubUser')({
	id: Schema.Number,
	html_url: Schema.String,
	login: Schema.String,
	avatar_url: Schema.String,
	name: Schema.optional(Schema.String),
	blog: Schema.optional(Schema.String),
	email: Schema.optional(Schema.String),
}) {}

/**
 * Represents a user authenticated via Google OAuth.
 *
 * @property sub - The unique identifier for the user (subject).
 * @property picture - The URL of the user's profile picture.
 * @property name - The full name of the user.
 * @property email - The user's email address.
 */
export class GoogleUser extends Schema.Class<GoogleUser>('GoogleUser')({
	sub: Schema.String,
	picture: Schema.String,
	name: Schema.String,
	email: Schema.String,
}) {}

/**
 * Returns the normalized domain string for Auth0 authentication.
 *
 * This function performs the following transformations:
 * - Removes any leading slash from the domain.
 * - Strips out the "http://" or "https://" protocol from the domain.
 * - Prepends "https://" to the resulting domain.
 *
 * @returns {string} The normalized domain string with "https://" prepended.
 */
export const cleanDomain = (domain: string): string =>
	pipe(
		domain,
		(domain) => domain.replace(/^\//, ''),
		(domain) => domain.replace(/(?:http|https):\/\//, ''),
		(domain) => `https://${domain}`
	);
