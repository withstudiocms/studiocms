import { logger } from '@it-astro:logger:studiocms-dashboard';
import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../utils/simpleResponse';

const { testingAndDemoMode } = developerConfig;

export const POST: APIRoute = async (ctx: APIContext): Promise<Response> => {
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

	const { userId } = jsonData;

	if (!userId) {
		return simpleResponse(400, 'Invalid form data, userId is required');
	}

	const token = await studioCMS_SDK.resetTokenBucket.new(userId);

	if (!token) {
		return simpleResponse(500, 'Failed to create reset link');
	}

	return new Response(JSON.stringify(token), {
		headers: {
			'content-type': 'application/json',
		},
		status: 200,
	});
};
