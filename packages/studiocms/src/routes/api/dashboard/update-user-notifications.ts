import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';

export const POST: APIRoute = async (context: APIContext) => {
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

	const userId = jsonData.id;
	const notifications = jsonData.notifications;

	if (!userId) {
		return apiResponseLogger(400, 'Invalid request');
	}

	const user = await studioCMS_SDK.GET.databaseEntry.users.byId(userId);

	if (!user) {
		return apiResponseLogger(404, 'User not found');
	}

	const updatedData = await studioCMS_SDK.AUTH.user.update(userId, {
		// @ts-expect-error drizzle broke the variable...
		notifications,
	});

	if (!updatedData) {
		return apiResponseLogger(400, 'Failed to update user notifications');
	}

	return apiResponseLogger(200, 'User notifications updated successfully');
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
