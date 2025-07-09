import { User } from 'studiocms:auth/lib';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect, Schema } from 'effect';
import { convertToVanilla, genLogger } from '../../../../../lib/effects/index.js';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';

type PermissionRank = 'visitor' | 'editor' | 'admin' | 'owner' | 'unknown';

export class JSONData extends Schema.Class<JSONData>('JSONData')({
	rank: Schema.Union(
		Schema.Literal('owner'),
		Schema.Literal('admin'),
		Schema.Literal('editor'),
		Schema.Literal('visitor'),
		Schema.Literal('unknown')
	),
}) {}

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:users:[id]:GET')(function* () {
			const sdk = yield* SDKCore;
			const user = yield* verifyAuthTokenFromHeader(context);

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

			const existingUser = yield* sdk.GET.users.byId(id);

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

			const loggedInUser = (yield* sdk.GET.users.all()).find((user) => user.id === id);

			if (!loggedInUser || loggedInUser === undefined) {
				return apiResponseLogger(400, 'User Error');
			}

			const permissionLevelInput = {
				isLoggedIn: true,
				user: loggedInUser,
				permissionLevel: rank as PermissionRank,
			};

			const userPermissionLevel = yield* User.getUserPermissionLevel(permissionLevelInput);

			const requiredPerms = () => {
				switch (existingUserRank) {
					case 'owner':
						return User.UserPermissionLevel.owner;
					case 'admin':
						return User.UserPermissionLevel.admin;
					case 'editor':
						return User.UserPermissionLevel.editor;
					case 'visitor':
						return User.UserPermissionLevel.visitor;
					default:
						return User.UserPermissionLevel.unknown;
				}
			};

			const isAllowed = userPermissionLevel > requiredPerms();

			if (!isAllowed) {
				return apiResponseLogger(401, 'Unauthorized');
			}

			return new Response(JSON.stringify(data), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}).pipe(SDKCore.Provide, User.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to fetch user data', error);
	});

export const PATCH: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:users:[id]:PATCH')(function* () {
			const sdk = yield* SDKCore;
			const user = yield* verifyAuthTokenFromHeader(context);

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

			const existingUser = yield* sdk.GET.users.byId(id);

			if (!existingUser) {
				return apiResponseLogger(400, 'User not found');
			}

			const { permissionsData } = existingUser;

			const existingUserRank = (permissionsData?.rank ?? 'admin') as PermissionRank;

			const loggedInUser = (yield* sdk.GET.users.all()).find((user) => user.id === id);

			if (!loggedInUser || loggedInUser === undefined) {
				return apiResponseLogger(400, 'User Error');
			}

			const permissionLevelInput = {
				isLoggedIn: true,
				user: loggedInUser,
				permissionLevel: rank as PermissionRank,
			};

			const userPermissionLevel = yield* User.getUserPermissionLevel(permissionLevelInput);

			const requiredPerms = () => {
				switch (existingUserRank) {
					case 'owner':
						return User.UserPermissionLevel.owner;
					case 'admin':
						return User.UserPermissionLevel.admin;
					case 'editor':
						return User.UserPermissionLevel.editor;
					case 'visitor':
						return User.UserPermissionLevel.visitor;
					default:
						return User.UserPermissionLevel.unknown;
				}
			};

			const isAllowed = userPermissionLevel > requiredPerms();

			if (!isAllowed) {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const jsonData = yield* Effect.tryPromise(() => context.request.json());

			const { rank: newRank } = yield* Schema.decodeUnknown(JSONData)(jsonData);

			if (!newRank) {
				return apiResponseLogger(400, 'Missing field: Rank is required');
			}

			const updateRank = yield* sdk.UPDATE.permissions({
				user: id,
				rank: newRank,
			});
			if (!updateRank) {
				return apiResponseLogger(400, 'Failed to update rank');
			}
			const updatedUser = yield* sdk.GET.users.byId(id);
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
			yield* Notifications.sendUserNotification('account_updated', id);
			yield* Notifications.sendAdminNotification('user_updated', username);

			return new Response(JSON.stringify(data), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}).pipe(SDKCore.Provide, User.Provide, Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Failed to update user data', error);
	});

export const DELETE: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:users:[id]:DELETE')(function* () {
			const sdk = yield* SDKCore;
			const user = yield* verifyAuthTokenFromHeader(context);

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

			const existingUser = yield* sdk.GET.users.byId(id);

			if (!existingUser) {
				return apiResponseLogger(400, 'User not found');
			}

			const { permissionsData } = existingUser;

			const existingUserRank = (permissionsData?.rank ?? 'admin') as PermissionRank;

			const loggedInUser = (yield* sdk.GET.users.all()).find((user) => user.id === id);

			if (!loggedInUser || loggedInUser === undefined) {
				return apiResponseLogger(400, 'User Error');
			}

			const permissionLevelInput = {
				isLoggedIn: true,
				user: loggedInUser,
				permissionLevel: rank as PermissionRank,
			};

			const userPermissionLevel = yield* User.getUserPermissionLevel(permissionLevelInput);

			const requiredPerms = () => {
				switch (existingUserRank) {
					case 'owner':
						return User.UserPermissionLevel.owner;
					case 'admin':
						return User.UserPermissionLevel.admin;
					case 'editor':
						return User.UserPermissionLevel.editor;
					case 'visitor':
						return User.UserPermissionLevel.visitor;
					default:
						return User.UserPermissionLevel.unknown;
				}
			};

			const isAllowed = userPermissionLevel > requiredPerms();

			if (!isAllowed) {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const response = yield* sdk.DELETE.user(id);

			if (!response) {
				return apiResponseLogger(400, 'Failed to delete user');
			}

			if (response.status === 'error') {
				return apiResponseLogger(400, response.message);
			}

			yield* Notifications.sendAdminNotification('user_deleted', existingUser.username);

			return apiResponseLogger(200, response.message);
		}).pipe(SDKCore.Provide, User.Provide, Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, `Failed to delete user: ${error}`);
	});

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, PATCH, DELETE',
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
			'Access-Control-Allow-Origin': '*',
		},
	});
};
