import { verifyPasswordStrength } from 'studiocms:auth/lib/password';
import { createLocalUser, verifyUsernameInput } from 'studiocms:auth/lib/user';
import { apiResponseLogger } from 'studiocms:logger';
import { sendAdminNotification } from 'studiocms:notifier';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import { verifyAuthToken } from '../../utils/auth-token.js';

type JSONData = {
	username: string | undefined;
	password: string | undefined;
	email: string | undefined;
	displayname: string | undefined;
	rank: 'owner' | 'admin' | 'editor' | 'visitor' | undefined;
};

export const GET: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner' && rank !== 'admin') {
		return apiResponseLogger(401, 'Unauthorized');
	}

	const users = await studioCMS_SDK.GET.database.users();

	let data = users.map(
		({ avatar, createdAt, email, id, name, permissionsData, updatedAt, url, username }) => ({
			avatar,
			createdAt,
			email,
			id,
			name,
			rank: permissionsData?.rank ?? 'unknown',
			updatedAt,
			url,
			username,
		})
	);

	if (rank !== 'owner') {
		data = data.filter((user) => user.rank !== 'owner');
	}

	const searchParams = context.url.searchParams;

	const rankFilter = searchParams.get('rank');
	const usernameFilter = searchParams.get('username');
	const nameFilter = searchParams.get('name');

	let filteredData = data;

	if (rankFilter) {
		filteredData = filteredData.filter((user) => user.rank === rankFilter);
	}

	if (usernameFilter) {
		filteredData = filteredData.filter((user) => user.username.includes(usernameFilter));
	}

	if (nameFilter) {
		filteredData = filteredData.filter((user) => user.name.includes(nameFilter));
	}

	return new Response(JSON.stringify(filteredData), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const POST: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner' && rank !== 'admin') {
		return apiResponseLogger(401, 'Unauthorized');
	}

	const jsonData: JSONData = await context.request.json();

	let { username, password, email, displayname, rank: newUserRank } = jsonData;

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

	if (!newUserRank) {
		return apiResponseLogger(400, 'Missing field: Rank is required');
	}

	// If the username is invalid, return an error
	if (verifyUsernameInput(username) !== true) {
		return apiResponseLogger(
			400,
			'Invalid username: Username must be between 3 and 20 characters, only contain lowercase letters, numbers, -, and _ as well as not be a commonly used username (admin, root, etc.)'
		);
	}

	// If the password is invalid, return an error
	if ((await verifyPasswordStrength(password)) !== true) {
		return apiResponseLogger(
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
			Allow: 'OPTIONS, GET, POST',
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
