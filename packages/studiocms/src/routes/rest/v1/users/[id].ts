import { verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { verifyAuthToken } from '../../utils/auth-token.js';

type PermissionRank = 'visitor' | 'editor' | 'admin' | 'owner' | 'unknown';

export const GET: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner' && rank !== 'admin') {
		return apiResponseLogger(401, 'Unauthorized');
	}

	const { id } = context.params;

	if (!id) {
		return apiResponseLogger(400, 'Invalid form data, id is required');
	}

	const existingUser = await studioCMS_SDK.GET.databaseEntry.users.byId(id);

	if (!existingUser) {
		return apiResponseLogger(400, 'User not found');
	}

	const { avatar, createdAt, email, name, permissionsData, updatedAt, url, username } =
		existingUser;

	const existingUserRank = (permissionsData?.rank ?? 'admin') as PermissionRank;

	const data = {
		avatar,
		createdAt,
		email,
		id,
		name,
		rank: existingUserRank,
		updatedAt,
		url,
		username,
	};

	const loggedInUser = (await studioCMS_SDK.GET.databaseTable.users()).find(
		(user) => user.id === id
	);

	if (!loggedInUser || loggedInUser === undefined) {
		return apiResponseLogger(400, 'User Error');
	}

	const permissionLevelInput = {
		isLoggedIn: true,
		user: loggedInUser,
		permissionLevel: rank as PermissionRank,
	};

	const isAllowed = await verifyUserPermissionLevel(permissionLevelInput, existingUserRank);

	if (!isAllowed) {
		return apiResponseLogger(401, 'Unauthorized');
	}

	return new Response(JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const PATCH: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner' && rank !== 'admin') {
		return apiResponseLogger(401, 'Unauthorized');
	}

	const { id } = context.params;

	if (!id) {
		return apiResponseLogger(400, 'Invalid form data, id is required');
	}

	const existingUser = await studioCMS_SDK.GET.databaseEntry.users.byId(id);

	if (!existingUser) {
		return apiResponseLogger(400, 'User not found');
	}

	const { permissionsData } = existingUser;

	const existingUserRank = (permissionsData?.rank ?? 'admin') as PermissionRank;

	const loggedInUser = (await studioCMS_SDK.GET.databaseTable.users()).find(
		(user) => user.id === id
	);

	if (!loggedInUser || loggedInUser === undefined) {
		return apiResponseLogger(400, 'User Error');
	}

	const permissionLevelInput = {
		isLoggedIn: true,
		user: loggedInUser,
		permissionLevel: rank as PermissionRank,
	};

	const isAllowed = await verifyUserPermissionLevel(permissionLevelInput, existingUserRank);

	if (!isAllowed) {
		return apiResponseLogger(401, 'Unauthorized');
	}

	const jsonData = await context.request.json();

	const { rank: newRank } = jsonData;

	if (!newRank) {
		return apiResponseLogger(400, 'Missing field: Rank is required');
	}

	const isRankValid = ['visitor', 'editor', 'admin', 'owner'].includes(newRank);

	if (!isRankValid) {
		return apiResponseLogger(400, 'Invalid rank');
	}

	const updateRank = await studioCMS_SDK.UPDATE.permissions({
		user: id,
		rank: rank,
	});

	if (!updateRank) {
		return apiResponseLogger(400, 'Failed to update rank');
	}

	const updatedUser = await studioCMS_SDK.GET.databaseEntry.users.byId(id);

	if (!updatedUser) {
		return apiResponseLogger(400, 'Failed to get updated user');
	}

	const {
		avatar,
		createdAt,
		email,
		name,
		permissionsData: newPermissionsData,
		updatedAt,
		url,
		username,
	} = updatedUser;

	const updatedUserRank = (newPermissionsData?.rank ?? 'unknown') as PermissionRank;

	const data = {
		avatar,
		createdAt,
		email,
		id,
		name,
		rank: updatedUserRank,
		updatedAt,
		url,
		username,
	};

	return new Response(JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const DELETE: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner' && rank !== 'admin') {
		return apiResponseLogger(401, 'Unauthorized');
	}

	const { id } = context.params;

	if (!id) {
		return apiResponseLogger(400, 'Invalid form data, id is required');
	}

	const existingUser = await studioCMS_SDK.GET.databaseEntry.users.byId(id);

	if (!existingUser) {
		return apiResponseLogger(400, 'User not found');
	}

	const { permissionsData } = existingUser;

	const existingUserRank = (permissionsData?.rank ?? 'admin') as PermissionRank;

	const loggedInUser = (await studioCMS_SDK.GET.databaseTable.users()).find(
		(user) => user.id === id
	);

	if (!loggedInUser || loggedInUser === undefined) {
		return apiResponseLogger(400, 'User Error');
	}

	const permissionLevelInput = {
		isLoggedIn: true,
		user: loggedInUser,
		permissionLevel: rank as PermissionRank,
	};

	const isAllowed = await verifyUserPermissionLevel(permissionLevelInput, existingUserRank);

	if (!isAllowed) {
		return apiResponseLogger(401, 'Unauthorized');
	}

	try {
		const response = await studioCMS_SDK.DELETE.user(id);

		if (!response) {
			return apiResponseLogger(400, 'Failed to delete user');
		}

		if (response.status === 'error') {
			return apiResponseLogger(400, response.message);
		}

		return apiResponseLogger(200, response.message);
	} catch (error) {
		return apiResponseLogger(400, `Failed to delete user: ${error}`);
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, PATCH, DELETE',
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
