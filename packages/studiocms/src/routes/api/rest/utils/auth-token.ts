import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext } from 'astro';
import { Effect, genLogger } from '../../../../effect.js';

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
	});
