import { User } from 'studiocms:auth/lib';
import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { tsPermissionsSelect } from 'studiocms:sdk/types';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '../../../effect.js';

export const { POST, DELETE, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/users.POST')(function* () {
				const [userHelper, notifications, sdk] = yield* Effect.all([User, Notifications, SDKCore]);

				// Get user data
				const userData = ctx.locals.StudioCMS.security?.userSessionData;

				// Check if user is logged in
				if (!userData?.isLoggedIn) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Check if user has permission
				const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isAdmin;
				if (!isAuthorized) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				const { id, rank, emailVerified } = yield* readAPIContextJson<{
					id: string;
					rank: string;
					emailVerified: boolean;
				}>(ctx);

				if (!id || !rank) {
					return apiResponseLogger(400, 'Invalid request');
				}

				const insertData: tsPermissionsSelect = {
					user: id,
					rank,
				};

				const user = yield* sdk.GET.users.byId(id);

				if (!user) {
					return apiResponseLogger(404, 'User not found');
				}

				const userPermissionLevel = yield* userHelper.getUserPermissionLevel(userData);

				const requiredPerms = () => {
					switch (user.permissionsData?.rank) {
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

				const isAllowedToUpdateRank = userPermissionLevel > requiredPerms();

				if (!isAllowedToUpdateRank) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Update user rank
				const updatedData = yield* sdk.UPDATE.permissions(insertData);

				if (!updatedData) {
					return apiResponseLogger(400, 'Failed to update user rank');
				}

				if (emailVerified) {
					// Update user email verification status
					yield* sdk.AUTH.user.update(id, {
						emailVerified: emailVerified,
					});
				}

				yield* Effect.all([
					notifications.sendUserNotification('account_updated', id),
					notifications.sendAdminNotification('user_updated', user.username),
				]);

				return apiResponseLogger(200, 'User rank updated successfully');
			}).pipe(User.Provide, Notifications.Provide),
		DELETE: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/users.DELETE')(function* () {
				const [notifications, sdk] = yield* Effect.all([Notifications, SDKCore]);

				// Check if demo mode is enabled
				if (developerConfig.demoMode !== false) {
					return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
				}

				// Get user data
				const userData = ctx.locals.StudioCMS.security?.userSessionData;

				// Check if user is logged in
				if (!userData?.isLoggedIn) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Check if user has permission
				const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isAdmin;
				if (!isAuthorized) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				const { userId, username, usernameConfirm } = yield* readAPIContextJson<{
					userId: string;
					username: string;
					usernameConfirm: string;
				}>(ctx);

				if (!userId || !username || !usernameConfirm) {
					return apiResponseLogger(400, 'Invalid request');
				}

				if (username !== usernameConfirm) {
					return apiResponseLogger(400, 'Username does not match');
				}

				const response = yield* sdk.DELETE.user(userId);

				if (!response) {
					return apiResponseLogger(400, 'Failed to delete user');
				}

				if (response.status === 'error') {
					return apiResponseLogger(400, response.message);
				}

				yield* notifications.sendAdminNotification('user_deleted', username);

				return apiResponseLogger(200, response.message);
			}).pipe(Notifications.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST', 'DELETE'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'DELETE', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
