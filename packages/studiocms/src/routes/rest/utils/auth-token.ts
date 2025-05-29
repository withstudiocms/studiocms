import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK, { SDKCore } from 'studiocms:sdk';
import type { APIContext } from 'astro';
import { Effect } from 'effect';
import { genLogger } from '../../../lib/effects/index.js';

/**
 * Get the auth token from the Authorization header
 *
 * Auth token is passed in the Authorization header as a Bearer token
 * @example
 * headers: {
 * 	Authorization: 'Bearer <authToken>'
 * }
 * @param headerString The Authorization header string
 * @returns The auth token or null if not found
 * @deprecated Use `getAuthTokenFromHeader` instead
 */
const getAuthToken = (headerString?: string | null) => {
	if (!headerString) {
		return null;
	}

	const parts = headerString.split(' ');

	if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
		return null;
	}

	return parts[1];
};

/**
 * Verify the auth token
 *
 * Auth token is passed in the Authorization header as a Bearer token
 * @example
 * headers: {
 * 	Authorization: 'Bearer <authToken>'
 * }
 * @param context The Astro API context
 * @returns The user data if the auth token is valid, otherwise a 401 response
 *
 * @deprecated Use `verifyAuthTokenFromHeader` instead
 */
export async function verifyAuthToken(context: APIContext) {
	const authToken = getAuthToken(context.request.headers.get('Authorization'));

	if (!authToken) {
		return apiResponseLogger(401, 'Unauthorized');
	}

	const user = await studioCMS_SDK.REST_API.tokens.verify(authToken);

	if (!user) {
		return apiResponseLogger(401, 'Unauthorized');
	}

	return user;
}

/**
 * Extracts the Bearer authentication token from the `Authorization` header of the given API context's request.
 *
 * This function attempts to retrieve the `Authorization` header from the request, and if present,
 * parses it to extract the token part of a Bearer token. If the header is missing, malformed, or does not
 * use the Bearer scheme, the function returns `null`.
 *
 * @param context - The API context containing the request object with headers.
 * @returns The extracted Bearer token as a string, or `null` if not found or invalid.
 */
const getAuthTokenFromHeader = (context: APIContext) =>
	genLogger('routes/rest/utils/auth-token/getAuthTokenFromHeader')(function* () {
		const authTokenData = yield* Effect.try(() => context.request.headers.get('Authorization'));

		if (!authTokenData) {
			return null;
		}

		const parts = authTokenData.split(' ');

		if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
			return null;
		}

		return parts[1];
	});

/**
 * Verifies the authentication token from the request header in the given API context.
 *
 * This generator function attempts to extract an authentication token from the request header,
 * verifies it using the SDK's REST API, and returns the associated user if verification succeeds.
 * If the token is missing or invalid, it returns a 401 Unauthorized API response.
 *
 * @param context - The API context containing the request information.
 * @returns The verified user object if authentication succeeds, or a 401 Unauthorized response if it fails.
 */
export const verifyAuthTokenFromHeader = (context: APIContext) =>
	genLogger('routes/rest/utils/auth-token/verifyAuthTokenFromHeader')(function* () {
		const sdk = yield* SDKCore;

		const authToken = yield* getAuthTokenFromHeader(context);

		if (!authToken) {
			return apiResponseLogger(401, 'Unauthorized');
		}

		const user = yield* sdk.REST_API.tokens.verify(authToken);

		if (!user) {
			return apiResponseLogger(401, 'Unauthorized');
		}
		return user;
	}).pipe(SDKCore.Provide);
