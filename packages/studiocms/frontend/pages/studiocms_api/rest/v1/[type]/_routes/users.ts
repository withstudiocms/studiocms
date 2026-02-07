import { Password, User } from 'studiocms:auth/lib';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import { UserPermissionLevel } from '@withstudiocms/auth-kit/types';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	genLogger,
	OptionsResponse,
	parseAPIContextJson,
} from '@withstudiocms/effect';
import { z } from 'astro/zod';
import { Effect, Schema } from 'effect';
import type { EndpointRoute } from './../../../../../../utils/rest-router.js';
import { verifyAuthTokenFromHeader } from '../../../utils/auth-token.js';

export class IndexJSONData extends Schema.Class<IndexJSONData>('IndexJSONData')({
	username: Schema.Union(Schema.String, Schema.Undefined),
	password: Schema.Union(Schema.String, Schema.Undefined),
	email: Schema.Union(Schema.String, Schema.Undefined),
	displayname: Schema.Union(Schema.String, Schema.Undefined),
	rank: Schema.Union(
		Schema.Literal('owner'),
		Schema.Literal('admin'),
		Schema.Literal('editor'),
		Schema.Literal('visitor'),
		Schema.Undefined
	),
}) {}

type PermissionRank = 'visitor' | 'editor' | 'admin' | 'owner' | 'unknown';

export class IdJSONData extends Schema.Class<IdJSONData>('IdJSONData')({
	rank: Schema.Union(
		Schema.Literal('owner'),
		Schema.Literal('admin'),
		Schema.Literal('editor'),
		Schema.Literal('visitor'),
		Schema.Literal('unknown')
	),
}) {}

export const usersRouter: EndpointRoute = {
	__idType: 'string',
	__index: createEffectAPIRoutes(
		{
			GET: (ctx) =>
				genLogger('studioCMS:rest:v1:users:GET')(function* () {
					const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

					if (user instanceof Response) {
						return user;
					}

					const { rank } = user;

					if (rank !== 'owner' && rank !== 'admin') {
						return apiResponseLogger(401, 'Unauthorized');
					}

					const users = yield* sdk.GET.users.all();

					let data = users.map(
						({
							avatar,
							createdAt,
							email,
							id,
							name,
							permissionsData,
							updatedAt,
							url,
							username,
						}) => ({
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

					const searchParams = ctx.url.searchParams;

					const rankFilter = searchParams.get('rank');
					const usernameFilter = searchParams.get('username');
					const nameFilter = searchParams.get('name');
					const usernameFilterLower = usernameFilter?.toLowerCase();
					const nameFilterLower = nameFilter?.toLowerCase();

					let filteredData = data;

					if (rankFilter) {
						filteredData = filteredData.filter((u) => u.rank === rankFilter);
					}

					if (usernameFilterLower) {
						filteredData = filteredData.filter((u) =>
							(u.username ?? '').toLowerCase().includes(usernameFilterLower)
						);
					}

					if (nameFilterLower) {
						filteredData = filteredData.filter((u) =>
							(u.name ?? '').toLowerCase().includes(nameFilterLower)
						);
					}

					return createJsonResponse(filteredData);
				}),
			POST: (ctx) =>
				genLogger('studioCMS:rest:v1:users:POST')(function* () {
					const [sdk, user, userUtils, passwordUtils, notifier] = yield* Effect.all([
						SDKCore,
						verifyAuthTokenFromHeader(ctx),
						User,
						Password,
						Notifications,
					]);

					if (user instanceof Response) {
						return user;
					}

					const { rank } = user;

					if (rank !== 'owner' && rank !== 'admin') {
						return apiResponseLogger(401, 'Unauthorized');
					}

					let {
						username,
						password,
						email,
						displayname,
						rank: newUserRank,
					} = yield* parseAPIContextJson(ctx, IndexJSONData);

					if (!username) {
						return apiResponseLogger(400, 'Missing field: Username is required');
					}

					// Only owners can assign the 'owner' rank
					if (newUserRank === 'owner' && rank !== 'owner') {
						return apiResponseLogger(401, 'Unauthorized');
					}

					if (!password) {
						password = yield* sdk.UTIL.Generators.generateRandomPassword(12);
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
					// Prevent privilege escalation: admins cannot assign owner rank
					if (rank === 'admin' && newUserRank === 'owner') {
						return apiResponseLogger(
							403,
							'Forbidden: insufficient permission to assign owner rank'
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

					const [verifyUsernameResponse, verifyPasswordResponse, { usernameSearch, emailSearch }] =
						yield* Effect.all([
							userUtils.verifyUsernameInput(username),
							passwordUtils.verifyPasswordStrength(password),
							sdk.AUTH.user.searchUsersForUsernameOrEmail(username, checkEmail.data),
						]);

					// If the username is invalid, return an error
					if (verifyUsernameResponse !== true) {
						return apiResponseLogger(400, verifyUsernameResponse);
					}

					// If the password is invalid, return an error(password);
					if (verifyPasswordResponse !== true) {
						return apiResponseLogger(400, verifyPasswordResponse);
					}

					if (usernameSearch.length > 0) {
						return apiResponseLogger(400, 'Invalid username: Username is already in use');
					}
					if (emailSearch.length > 0) {
						return apiResponseLogger(400, 'Invalid email: Email is already in use');
					}

					// Create a new user
					const newUser = yield* userUtils.createLocalUser(
						displayname,
						username,
						checkEmail.data,
						password
					);
					const updateRank = yield* sdk.UPDATE.permissions({
						user: newUser.id,
						rank: newUserRank,
					});
					yield* notifier.sendAdminNotification('new_user', newUser.username);
					return apiResponseLogger(
						200,
						JSON.stringify({
							username,
							email: checkEmail.data,
							displayname,
							rank: updateRank.rank,
							password,
						})
					);
				}).pipe(Notifications.Provide),
			OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET', 'POST'] })),
			ALL: () => Effect.try(() => AllResponse()),
		},
		{
			cors: { methods: ['GET', 'POST', 'OPTIONS'] },
			onError: (error) => {
				console.error('API Error:', error);
				return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
			},
		}
	),
	id: (id: string) =>
		createEffectAPIRoutes(
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

						const existingUser = yield* sdk.GET.users.byId(id);

						if (!existingUser) {
							return apiResponseLogger(404, 'User not found');
						}

						const { avatar, createdAt, email, name, permissionsData, updatedAt, url, username } =
							existingUser;

						const existingUserRank = (permissionsData?.rank ?? 'visitor') as PermissionRank;

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

						const loggedInUser = yield* sdk.GET.users.byId(user.userId);

						if (!loggedInUser || loggedInUser === undefined) {
							return apiResponseLogger(400, 'User Error');
						}

						const permissionLevelInput = {
							isLoggedIn: true,
							user: loggedInUser,
							permissionLevel: (loggedInUser.permissionsData?.rank ?? 'visitor') as PermissionRank,
						};

						const userPermissionLevel =
							yield* userUtils.getUserPermissionLevel(permissionLevelInput);

						const requiredPerms = () => {
							switch (existingUserRank) {
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

						const isAllowed = userPermissionLevel > requiredPerms();

						if (!isAllowed) {
							return apiResponseLogger(401, 'Unauthorized');
						}

						return createJsonResponse(data);
					}),
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

						const existingUser = yield* sdk.GET.users.byId(id);

						if (!existingUser) {
							return apiResponseLogger(400, 'User not found');
						}

						const { permissionsData } = existingUser;

						const existingUserRank = (permissionsData?.rank ?? 'visitor') as PermissionRank;

						const loggedInUser = yield* sdk.GET.users.byId(user.userId);

						if (!loggedInUser || loggedInUser === undefined) {
							return apiResponseLogger(400, 'User Error');
						}

						const permissionLevelInput = {
							isLoggedIn: true,
							user: loggedInUser,
							permissionLevel: (loggedInUser.permissionsData?.rank ?? 'visitor') as PermissionRank,
						};

						const userPermissionLevel =
							yield* userUtils.getUserPermissionLevel(permissionLevelInput);

						const requiredPerms = () => {
							switch (existingUserRank) {
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

						const isAllowed = userPermissionLevel > requiredPerms();

						if (!isAllowed) {
							return apiResponseLogger(401, 'Unauthorized');
						}

						const { rank: newRank } = yield* parseAPIContextJson(ctx, IdJSONData);

						if (!newRank) {
							return apiResponseLogger(400, 'Missing field: Rank is required');
						}

						// Prevent privilege escalation: actor cannot assign a rank >= their own
						const requiredPermsForNewRank = (() => {
							switch (newRank) {
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
						})();
						if (userPermissionLevel <= requiredPermsForNewRank) {
							return apiResponseLogger(403, 'Forbidden');
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
					}).pipe(Notifications.Provide),
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

						if (id === user.userId) {
							return apiResponseLogger(400, 'Cannot delete your own account');
						}

						const existingUser = yield* sdk.GET.users.byId(id);

						if (!existingUser) {
							return apiResponseLogger(400, 'User not found');
						}

						const { permissionsData } = existingUser;

						const existingUserRank = (permissionsData?.rank ?? 'visitor') as PermissionRank;

						const loggedInUser = yield* sdk.GET.users.byId(user.userId);

						if (!loggedInUser || loggedInUser === undefined) {
							return apiResponseLogger(400, 'User Error');
						}

						const permissionLevelInput = {
							isLoggedIn: true,
							user: loggedInUser,
							permissionLevel: (loggedInUser.permissionsData?.rank ?? 'visitor') as PermissionRank,
						};

						const userPermissionLevel =
							yield* userUtils.getUserPermissionLevel(permissionLevelInput);

						const requiredPerms = () => {
							switch (existingUserRank) {
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
					}).pipe(Notifications.Provide),
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
		),
};
