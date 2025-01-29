import { logger } from '@it-astro:logger:studiocms-dashboard';
import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import { studioCMS_SDK_Cache } from 'studiocms:sdk/cache';
import type { tsSiteConfigSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../utils/simpleResponse';

const { testingAndDemoMode } = developerConfig;

export const POST: APIRoute = async (context: APIContext): Promise<Response> => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		logger.warn('Testing and demo mode is enabled, this action is disabled.');
		return simpleResponse(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Get user data
	const userData = await getUserData(context);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return simpleResponse(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'owner');
	if (!isAuthorized) {
		return simpleResponse(403, 'Unauthorized');
	}

	// Get Json Data
	const siteConfig: Omit<tsSiteConfigSelect, 'id'> = await context.request.json();

	// Validate form data
	if (!siteConfig.title) {
		logger.error('Invalid form data, title is required');
		return simpleResponse(400, 'Invalid form data, title is required');
	}

	if (!siteConfig.description) {
		logger.error('Invalid form data, description is required');
		return simpleResponse(400, 'Invalid form data, description is required');
	}

	if (!siteConfig.loginPageBackground) {
		logger.error('Invalid form data, loginPageBackground is required');
		return simpleResponse(400, 'Invalid form data, loginPageBackground is required');
	}

	if (siteConfig.loginPageBackground === 'custom' && !siteConfig.loginPageCustomImage) {
		logger.error('Invalid form data, loginPageCustomImage is required');
		return simpleResponse(400, 'Invalid form data, loginPageCustomImage is required');
	}

	// Update Database
	try {
		await studioCMS_SDK_Cache.UPDATE.siteConfig(siteConfig);

		logger.info('Site config updated');
		return simpleResponse(200, 'Site config updated');
	} catch (error) {
		// Log error
		if (error instanceof Error) {
			logger.error(error.message);
		}
		// Return Error Response
		return simpleResponse(500, 'Error updating site config');
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
