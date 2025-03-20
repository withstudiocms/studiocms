import { verifyPasswordStrength } from 'studiocms:auth/lib/password';
import {
	createLocalUser,
	getUserData,
	verifyUserPermissionLevel,
	verifyUsernameInput,
} from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { sendAdminNotification } from 'studiocms:notifier';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';

const { testingAndDemoMode } = developerConfig;

type JSONData = {
	username: string | undefined;
	password: string | undefined;
	email: string | undefined;
	displayname: string | undefined;
	rank: 'owner' | 'admin' | 'editor' | 'visitor' | undefined;
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

	let { username, password, email, displayname, rank } = jsonData;

	// If the username, password, email, or display name is missing, return an error
	if (!username) {
		return apiResponseLogger(400, 'Missing field: Username is required');
	}

	if (!password) {
		password = studioCMS_SDK.generateRandomPassword(12);
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
	const verifyUsernameResponse = verifyUsernameInput(username);
	if (verifyUsernameResponse !== true) {
		return apiResponseLogger(400, verifyUsernameResponse);
	}

	// If the password is invalid, return an error
	const verifyPasswordResponse = await verifyPasswordStrength(password);
	if (verifyPasswordResponse !== true) {
		return apiResponseLogger(400, verifyPasswordResponse);
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

	// Create a new user
	const newUser = await createLocalUser(displayname, username, email, password);

	const updateRank = await studioCMS_SDK.UPDATE.permissions({
		user: newUser.id,
		rank: rank,
	});

	await sendAdminNotification('new_user', newUser.username);

	return apiResponseLogger(
		200,
		JSON.stringify({ username, email, displayname, rank: updateRank.rank, password })
	);
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
