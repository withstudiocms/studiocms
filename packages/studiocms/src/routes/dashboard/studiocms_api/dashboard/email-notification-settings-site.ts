import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK from 'studiocms:sdk';
import type { tsNotificationSettingsSelect } from 'studiocms:sdk/types';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (ctx) => {
	// Get user data
	const userData = await getUserData(ctx);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'owner');
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	const jsonData: Omit<tsNotificationSettingsSelect, 'id'> = await ctx.request.json();

	try {
		await studioCMS_SDK.notificationSettings.site.update(jsonData);

		return apiResponseLogger(200, 'Notification settings updated');
	} catch (error) {
		return apiResponseLogger(500, 'Error updating notification settings', error);
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
