import {
	getUserData,
	verifyUserPermissionLevel,
	verifyUsernameInput,
} from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import { apiResponseLogger } from 'studiocms:logger';
import { sendAdminNotification } from 'studiocms:notifier';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';

const { testingAndDemoMode } = developerConfig;

type JSONData = {
	username: string | undefined;
	email: string | undefined;
	displayname: string | undefined;
	rank: 'owner' | 'admin' | 'editor' | 'visitor' | undefined;
	originalUrl: string;
};

export const POST: APIRoute = async (ctx: APIContext) => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		return apiResponseLogger(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Get user data
	const userData = await getUserData(ctx);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'admin');
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	const jsonData: JSONData = await ctx.request.json();

	const { username, email, displayname, rank, originalUrl } = jsonData;

	// If the username, password, email, or display name is missing, return an error
	if (!username) {
		return apiResponseLogger(400, 'Missing field: Username is required');
	}

	if (!email) {
		return apiResponseLogger(400, 'Missing field: Email is required');
	}

	if (!displayname) {
		return apiResponseLogger(400, 'Missing field: Display name is required');
	}

	if (!rank) {
		return apiResponseLogger(400, 'Missing field: Rank is required');
	}

	// If the username is invalid, return an error
	if (verifyUsernameInput(username) !== true) {
		return apiResponseLogger(
			400,
			'Invalid username: Username must be between 3 and 20 characters, only contain lowercase letters, numbers, -, and _ as well as not be a commonly used username (admin, root, etc.)'
		);
	}

	// If the email is invalid, return an error
	const checkEmail = z.coerce
		.string()
		.email({ message: 'Email address is invalid' })
		.safeParse(email);

	if (!checkEmail.success) {
		return apiResponseLogger(400, `Invalid email: ${checkEmail.error.message}`);
	}

	const { usernameSearch, emailSearch } =
		await studioCMS_SDK.AUTH.user.searchUsersForUsernameOrEmail(username, checkEmail.data);

	if (usernameSearch.length > 0) {
		return apiResponseLogger(400, 'Invalid username: Username is already in use');
	}

	if (emailSearch.length > 0) {
		return apiResponseLogger(400, 'Invalid email: Email is already in use');
	}

	function generateResetLink(token: {
		id: string;
		userId: string;
		token: string;
	}) {
		return `${originalUrl}${StudioCMSRoutes.mainLinks.dashboardIndex}/reset-password?userid=${token.userId}&token=${token.token}&id=${token.id}`;
	}

	// Creates a new user invite
	const newUser = await studioCMS_SDK.AUTH.user.create(
		{
			username,
			email: checkEmail.data,
			name: displayname,
			createdAt: new Date(),
			id: crypto.randomUUID(),
		},
		rank
	);

	const token = await studioCMS_SDK.resetTokenBucket.new(newUser.id);

	if (!token) {
		return apiResponseLogger(500, 'Failed to create reset token');
	}

	const resetLink = generateResetLink(token);

	await sendAdminNotification('new_user', newUser.username);

	return new Response(JSON.stringify({ link: resetLink }), {
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
