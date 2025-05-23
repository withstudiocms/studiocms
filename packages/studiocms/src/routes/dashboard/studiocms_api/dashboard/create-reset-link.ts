import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { sendAdminNotification } from 'studiocms:notifier';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';

export const POST: APIRoute = async (context: APIContext): Promise<Response> => {
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
	const isAuthorized = context.locals.userPermissionLevel.isAdmin;
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	const jsonData = await context.request.json();

	const { userId } = jsonData;

	if (!userId) {
		return apiResponseLogger(400, 'Invalid form data, userId is required');
	}

	const token = await studioCMS_SDK.resetTokenBucket.new(userId);

	if (!token) {
		return apiResponseLogger(500, 'Failed to create reset link');
	}

	const user = await studioCMS_SDK.GET.databaseEntry.users.byId(userId);

	if (!user) {
		return apiResponseLogger(404, 'User not found');
	}

	await sendAdminNotification('user_updated', user.username);

	return new Response(JSON.stringify(token), {
		headers: {
			'content-type': 'application/json',
		},
		status: 200,
	});
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
