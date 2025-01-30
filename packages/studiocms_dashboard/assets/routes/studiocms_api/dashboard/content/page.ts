import { logger } from '@it-astro:logger:studiocms-dashboard';
import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import studioCMS_SDK from 'studiocms:sdk';
import { studioCMS_SDK_Cache } from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../../utils/simpleResponse';

const { testingAndDemoMode } = developerConfig;

// TODO: Implement this route

export const POST: APIRoute = async (context: APIContext) => {
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
	const isAuthorized = await verifyUserPermissionLevel(userData, 'editor');
	if (!isAuthorized) {
		return simpleResponse(403, 'Unauthorized');
	}

	return simpleResponse(501, 'Not implemented');
};

export const PATCH: APIRoute = async (context: APIContext) => {
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
	const isAuthorized = await verifyUserPermissionLevel(userData, 'editor');
	if (!isAuthorized) {
		return simpleResponse(403, 'Unauthorized');
	}

	return simpleResponse(501, 'Not implemented');
};

export const DELETE: APIRoute = async (context: APIContext) => {
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
	const isAuthorized = await verifyUserPermissionLevel(userData, 'admin');
	if (!isAuthorized) {
		return simpleResponse(403, 'Unauthorized');
	}

	const jsonData = await context.request.json();

	const { id, slug } = jsonData;

	if (!id) {
		return simpleResponse(400, 'Invalid request');
	}

	if (!slug) {
		return simpleResponse(400, 'Invalid request');
	}

	const isHomePage = await studioCMS_SDK_Cache.GET.page.bySlug('index', 'studiocms');

	if (isHomePage.data && isHomePage.data.id === id) {
		return simpleResponse(400, 'Cannot delete home page');
	}

	try {
		await studioCMS_SDK.DELETE.page(id);
		studioCMS_SDK_Cache.CLEAR.page.byId(id);

		return simpleResponse(200, 'Page deleted successfully');
	} catch (error) {
		logger.error(`Failed to delete page ${(error as Error).message}`);
		return simpleResponse(500, 'Failed to delete page');
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST, DELETE, PATCH',
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
