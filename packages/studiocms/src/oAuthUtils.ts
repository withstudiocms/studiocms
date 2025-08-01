import type { APIContext } from 'astro';
import { AstroError } from 'astro/errors';
import { Data, Effect } from './effect.js';

/**
 * Error class representing a failure during the validation of an authentication code.
 *
 * @extends Data.TaggedError
 * @property message - A descriptive error message explaining the cause of the failure.
 * @property provider - The authentication provider associated with the error (e.g., "auth0").
 */
export class ValidateAuthCodeError extends Data.TaggedError('ValidateAuthCodeError')<{
	message: string;
	provider: string;
}> {}

/**
 * Retrieves the value of a specified query parameter from the given API context's URL.
 *
 * @param context - The API context containing the URL to extract the parameter from.
 * @param name - The name of the query parameter to retrieve.
 * @returns An Effect that resolves to the value of the query parameter, or throws an AstroError if parsing fails.
 */
export const getUrlParam = ({ url }: APIContext, name: string) =>
	Effect.try({
		try: () => url.searchParams.get(name),
		catch: () => new AstroError('Failed to parse URL from Astro context'),
	});

/**
 * Retrieves the value of a cookie from the provided API context using the specified key.
 *
 * Wraps the retrieval in an Effect, returning the cookie value if found, or `null` if not present.
 * Throws an `AstroError` if there is a failure during the cookie retrieval process.
 *
 * @param context - The API context containing the cookies object.
 * @param key - The name of the cookie to retrieve.
 * @returns An Effect that resolves to the cookie value as a string, or `null` if not found.
 */
export const getCookie = ({ cookies }: APIContext, key: string) =>
	Effect.try({
		try: () => cookies.get(key)?.value ?? null,
		catch: () => new AstroError('Failed to parse get Cookies from Astro context'),
	});
