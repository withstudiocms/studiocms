import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';

export const POST: APIRoute = async (context: APIContext) => {
	// Check if demo mode is enabled
	if (developerConfig.demoMode !== false) {
		return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
	}

	// Get user data
	const userData = context.locals.userSessionData;

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = context.locals.userPermissionLevel.isEditor;
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Get Json Data
	const jsonData: { description: string; user: string } = await context.request.json();

	// Validate form data
	if (!jsonData.description) {
		return apiResponseLogger(400, 'Invalid form data, description is required');
	}

	if (!jsonData.user) {
		return apiResponseLogger(400, 'Invalid form data, user is required');
	}

	// Update Database
	try {
		const newToken = await studioCMS_SDK.REST_API.tokens.new(jsonData.user, jsonData.description);

		return new Response(JSON.stringify({ token: newToken.key }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		});
	} catch (error) {
		// Return Error Response
		return apiResponseLogger(500, 'Error creating new token');
	}
};

export const DELETE: APIRoute = async (context: APIContext) => {
	// Check if demo mode is enabled
	if (developerConfig.demoMode !== false) {
		return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
	}

	// Get user data
	const userData = context.locals.userSessionData;

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = context.locals.userPermissionLevel.isEditor;
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Get Json Data
	const jsonData: { tokenID: string; userID: string } = await context.request.json();

	// Validate form data
	if (!jsonData.tokenID) {
		return apiResponseLogger(400, 'Invalid form data, tokenID is required');
	}

	if (!jsonData.userID) {
		return apiResponseLogger(400, 'Invalid form data, userID is required');
	}

	// Update Database
	try {
		await studioCMS_SDK.REST_API.tokens.delete(jsonData.userID, jsonData.tokenID);

		return apiResponseLogger(200, 'Token deleted');
	} catch (error) {
		// Return Error Response
		return apiResponseLogger(500, 'Error deleting token');
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST',
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
