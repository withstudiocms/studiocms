import { UserPermissionLevel, getUserPermissionLevel } from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { sendAdminNotification, sendUserNotification } from 'studiocms:notifier';
import studioCMS_SDK from 'studiocms:sdk';
import type { tsPermissionsSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';

type RankEnum = 'visitor' | 'editor' | 'admin' | 'owner' | 'unknown';

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

	const jsonData: {
		id: string;
		rank: string;
		emailVerified: boolean;
	} = await context.request.json();

	const { id, rank, emailVerified } = jsonData;

	if (!id || !rank) {
		return apiResponseLogger(400, 'Invalid request');
	}

	const insertData: tsPermissionsSelect = {
		user: id,
		rank,
	};

	const user = await studioCMS_SDK.GET.databaseEntry.users.byId(id);

	if (!user) {
		return apiResponseLogger(404, 'User not found');
	}

	const userPermissionLevel = getUserPermissionLevel(userData);

	const requiredPerms = () => {
		switch (user.permissionsData?.rank) {
			case 'owner':
				return UserPermissionLevel.owner;
			case 'admin':
				return UserPermissionLevel.admin;
			case 'editor':
				return UserPermissionLevel.editor;
			case 'visitor':
				return UserPermissionLevel.visitor;
			default:
				return UserPermissionLevel.unknown;
		}
	};

	const isAllowedToUpdateRank = userPermissionLevel > requiredPerms();

	if (!isAllowedToUpdateRank) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Update user rank
	const updatedData = await studioCMS_SDK.UPDATE.permissions(insertData);

	if (!updatedData) {
		return apiResponseLogger(400, 'Failed to update user rank');
	}

	if (emailVerified) {
		// Update user email verification status
		await studioCMS_SDK.AUTH.user.update(id, {
			// @ts-expect-error drizzle broke the variable...
			emailVerified: emailVerified,
		});
	}

	await sendUserNotification('account_updated', id);
	await sendAdminNotification('user_updated', user.username);

	return apiResponseLogger(200, 'User rank updated successfully');
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
	const isAuthorized = context.locals.userPermissionLevel.isAdmin;
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	const jsonData = await context.request.json();

	const { userId, username, usernameConfirm } = jsonData;

	if (!userId || !username || !usernameConfirm) {
		return apiResponseLogger(400, 'Invalid request');
	}

	if (username !== usernameConfirm) {
		return apiResponseLogger(400, 'Username does not match');
	}

	// Delete user
	try {
		const response = await studioCMS_SDK.DELETE.user(userId);

		if (!response) {
			return apiResponseLogger(400, 'Failed to delete user');
		}

		if (response.status === 'error') {
			return apiResponseLogger(400, response.message);
		}

		await sendAdminNotification('user_deleted', username);

		return apiResponseLogger(200, response.message);
	} catch (error) {
		return apiResponseLogger(400, 'Failed to delete user');
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
