import { developerConfig } from 'studiocms:config';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext } from 'astro';
import { simpleResponse } from '../../../utils/simpleResponse.js';

const { testingAndDemoMode } = developerConfig;

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
 */
export async function verifyAuthToken(context: APIContext) {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		return simpleResponse(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	const authToken = getAuthToken(context.request.headers.get('Authorization'));

	if (!authToken) {
		return simpleResponse(401, 'Unauthorized');
	}

	const user = await studioCMS_SDK.REST_API.tokens.verify(authToken);

	if (!user) {
		return simpleResponse(401, 'Unauthorized');
	}

	return user;
}
