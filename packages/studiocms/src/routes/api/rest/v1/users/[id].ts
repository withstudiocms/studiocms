import { User } from 'studiocms:auth/lib';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	parseAPIContextJson,
	Schema,
} from '../../../../../effect.js';
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

export const { ALL, DELETE, GET, OPTIONS, PATCH } = createEffectAPIRoutes(
	{
		GET: (ctx) =>
			genLogger('studioCMS:rest:v1:users:[id]:GET')(function* () {
				const [sdk, user, userUtils] = yield* Effect.all([
					SDKCore,
					verifyAuthTokenFromHeader(ctx),
					User,
				]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const { id } = ctx.params;

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

				const userPermissionLevel = yield* userUtils.getUserPermissionLevel(permissionLevelInput);

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

				return createJsonResponse(data);
			}).pipe(User.Provide),
		PATCH: (ctx) =>
			genLogger('studioCMS:rest:v1:users:[id]:PATCH')(function* () {
				const [sdk, user, userUtils, notifier] = yield* Effect.all([
					SDKCore,
					verifyAuthTokenFromHeader(ctx),
					User,
					Notifications,
				]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const { id } = ctx.params;

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

				const userPermissionLevel = yield* userUtils.getUserPermissionLevel(permissionLevelInput);

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

				const { rank: newRank } = yield* parseAPIContextJson(ctx, JSONData);

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
				yield* notifier.sendUserNotification('account_updated', id);
				yield* notifier.sendAdminNotification('user_updated', username);

				return createJsonResponse(data);
			}).pipe(User.Provide, Notifications.Provide),
		DELETE: (ctx) =>
			genLogger('studioCMS:rest:v1:users:[id]:DELETE')(function* () {
				const [sdk, user, userUtils, notifier] = yield* Effect.all([
					SDKCore,
					verifyAuthTokenFromHeader(ctx),
					User,
					Notifications,
				]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const { id } = ctx.params;

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

				const userPermissionLevel = yield* userUtils.getUserPermissionLevel(permissionLevelInput);

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

				yield* notifier.sendAdminNotification('user_deleted', existingUser.username);

				return apiResponseLogger(200, response.message);
			}).pipe(User.Provide, Notifications.Provide),
		OPTIONS: () =>
			Effect.try(() => OptionsResponse({ allowedMethods: ['GET', 'PATCH', 'DELETE'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
		},
	}
);
