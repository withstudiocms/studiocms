import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { tsSiteConfigSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';

export const POST: APIRoute = async (context: APIContext): Promise<Response> => {
	// Get user data
	const userData = context.locals.userSessionData;

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = context.locals.userPermissionLevel.isOwner;
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Get Json Data
	const siteConfig: Omit<tsSiteConfigSelect, 'id'> = await context.request.json();

	// Validate form data
	if (!siteConfig.title) {
		return apiResponseLogger(400, 'Invalid form data, title is required');
	}

	if (!siteConfig.description) {
		return apiResponseLogger(400, 'Invalid form data, description is required');
	}

	if (!siteConfig.loginPageBackground) {
		return apiResponseLogger(400, 'Invalid form data, loginPageBackground is required');
	}

	if (siteConfig.loginPageBackground === 'custom' && !siteConfig.loginPageCustomImage) {
		return apiResponseLogger(400, 'Invalid form data, loginPageCustomImage is required');
	}

	// Update Database
	try {
		await studioCMS_SDK_Cache.UPDATE.siteConfig(siteConfig);

		return apiResponseLogger(200, 'Site config updated');
	} catch (error) {
		// Return Error Response
		return apiResponseLogger(500, 'Error updating site config', error);
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST',
			'ALLOW-ACCESS-CONTROL-ORIGIN': '*',
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
