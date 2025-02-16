import { verifyPasswordStrength } from 'studiocms:auth/lib/password';
import {
	createLocalUser,
	getUserData,
	verifyUserPermissionLevel,
	verifyUsernameInput,
} from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import { simpleResponse } from '../../../../utils/simpleResponse.js';

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

	const jsonData: JSONData = await ctx.request.json();

	let { username, password, email, displayname, rank } = jsonData;

	// If the username, password, email, or display name is missing, return an error
	if (!username) {
		return simpleResponse(400, 'Missing field: Username is required');
	}

	if (!password) {
		password = studioCMS_SDK.generateRandomPassword(12);
	}

	if (!email) {
		return simpleResponse(400, 'Missing field: Email is required');
	}

	if (!displayname) {
		return simpleResponse(400, 'Missing field: Display name is required');
	}

	if (!rank) {
		return simpleResponse(400, 'Missing field: Rank is required');
	}

	// If the username is invalid, return an error
	if (verifyUsernameInput(username) !== true) {
		return simpleResponse(
			400,
			'Invalid username: Username must be between 3 and 20 characters, only contain lowercase letters, numbers, -, and _ as well as not be a commonly used username (admin, root, etc.)'
		);
	}

	// If the password is invalid, return an error
	if ((await verifyPasswordStrength(password)) !== true) {
		return simpleResponse(
			400,
			'Invalid password: Password must be between 6 and 255 characters, and not be in the <a href="https://haveibeenpwned.com/Passwords" target="_blank">pwned password database</a>.'
		);
	}

	// If the email is invalid, return an error
	const checkEmail = z.coerce
		.string()
		.email({ message: 'Email address is invalid' })
		.safeParse(email);

	if (!checkEmail.success) {
		return simpleResponse(400, `Invalid email: ${checkEmail.error.message}`);
	}

	const { usernameSearch, emailSearch } =
		await studioCMS_SDK.AUTH.user.searchUsersForUsernameOrEmail(username, checkEmail.data);

	if (usernameSearch.length > 0) {
		return simpleResponse(400, 'Invalid username: Username is already in use');
	}

	if (emailSearch.length > 0) {
		return simpleResponse(400, 'Invalid email: Email is already in use');
	}

	// Create a new user
	const newUser = await createLocalUser(displayname, username, email, password);

	const updateRank = await studioCMS_SDK.UPDATE.permissions({
		user: newUser.id,
		rank: rank,
	});

	return simpleResponse(
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
