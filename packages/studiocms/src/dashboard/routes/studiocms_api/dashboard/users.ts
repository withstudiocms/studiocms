import { logger } from '@it-astro:logger:studiocms-dashboard';
import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import studioCMS_SDK from 'studiocms:sdk';
import type { tsPermissionsSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../utils/simpleResponse';

const { testingAndDemoMode } = developerConfig;

export const POST: APIRoute = async (ctx: APIContext) => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		logger.warn('Testing and demo mode is enabled, this action is disabled.');
		return simpleResponse(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Get user data
	const userData = await getUserData(ctx);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return simpleResponse(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'admin');
	if (!isAuthorized) {
		return simpleResponse(403, 'Unauthorized');
	}

	const jsonData = await ctx.request.json();

	const { id, rank } = jsonData;

	if (!id || !rank) {
		return simpleResponse(400, 'Invalid request');
	}

	const insertData: tsPermissionsSelect = {
		user: id,
		rank,
	};

	// Update user rank
	const updatedData = await studioCMS_SDK.UPDATE.permissions(insertData);

	if (!updatedData) {
		return simpleResponse(400, 'Failed to update user rank');
	}

	return simpleResponse(200, 'User rank updated successfully');
};

export const DELETE: APIRoute = async (ctx: APIContext) => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		logger.warn('Testing and demo mode is enabled, this action is disabled.');
		return simpleResponse(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Get user data
	const userData = await getUserData(ctx);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return simpleResponse(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'admin');
	if (!isAuthorized) {
		return simpleResponse(403, 'Unauthorized');
	}

	const jsonData = await ctx.request.json();

	const { userId, username, usernameConfirm } = jsonData;

	if (!userId || !username || !usernameConfirm) {
		return simpleResponse(400, 'Invalid request');
	}

	if (username !== usernameConfirm) {
		return simpleResponse(400, 'Username does not match');
	}

	// Delete user
	try {
		const response = await studioCMS_SDK.DELETE.user(userId);

		if (!response) {
			return simpleResponse(400, 'Failed to delete user');
		}

		return simpleResponse(200, response.message);
	} catch (error) {
		return simpleResponse(400, 'Failed to delete user');
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST, DELETE',
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
