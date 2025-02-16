import { verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../../utils/simpleResponse.js';
import { verifyAuthToken } from '../../utils/auth-token.js';

export const GET: APIRoute = async (context: APIContext) => {
	const user = await verifyAuthToken(context);

	if (user instanceof Response) {
		return user;
	}

	const { rank } = user;

	if (rank !== 'owner' && rank !== 'admin') {
		return simpleResponse(401, 'Unauthorized');
	}

	const { id } = context.params;

	if (!id) {
		return simpleResponse(400, 'Invalid form data, id is required');
	}

	const existingUser = await studioCMS_SDK.GET.databaseEntry.users.byId(id);

	if (!existingUser) {
		return simpleResponse(400, 'User not found');
	}

	const { avatar, createdAt, email, name, permissionsData, updatedAt, url, username } =
		existingUser;

	const existingUserRank = (permissionsData?.rank ?? 'admin') as
		| 'visitor'
		| 'editor'
		| 'admin'
		| 'owner'
		| 'unknown';

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
		return simpleResponse(400, 'User Error');
	}

	const permissionLevelInput = {
		isLoggedIn: true,
		user: loggedInUser,
		permissionLevel: rank as 'visitor' | 'editor' | 'admin' | 'owner' | 'unknown',
	};

	const isAllowedToView = await verifyUserPermissionLevel(permissionLevelInput, existingUserRank);

	if (!isAllowedToView) {
		return simpleResponse(401, 'Unauthorized');
	}

	return new Response(JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET',
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
