import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext } from 'astro';

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
