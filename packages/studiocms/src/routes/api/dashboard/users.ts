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

				// Validate rank to prevent invalid updates
				const validRanks = new Set(['owner', 'admin', 'editor', 'visitor']);
				if (!validRanks.has(rank)) {
					return apiResponseLogger(400, 'Invalid rank supplied');
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

				const toLevel = (r?: string) => {
					switch (r) {
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

				const targetCurrentLevel = toLevel(user.permissionsData?.rank);
				const targetNewLevel = toLevel(rank);

				const isAllowedToUpdateRank =
					userPermissionLevel > targetCurrentLevel &&
					userPermissionLevel > targetNewLevel &&
					(rank !== 'owner' || userPermissionLevel === User.UserPermissionLevel.owner);

				if (!isAllowedToUpdateRank) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Update user rank
				const updatedData = yield* sdk.UPDATE.permissions(insertData);

				if (!updatedData) {
					return apiResponseLogger(400, 'Failed to update user rank');
				}

				if (typeof emailVerified === 'boolean') {
					// Update user email verification status
					yield* sdk.AUTH.user.update(id, {
						emailVerified,
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

				// Verify target user and confirm typed username matches actual username
				const targetUser = yield* sdk.GET.users.byId(userId);
				if (!targetUser) {
					return apiResponseLogger(404, 'User not found');
				}
				if (targetUser.username !== username) {
					return apiResponseLogger(400, 'Username confirmation does not match target user');
				}

				// Prevent self-deletion
				if (userData.user?.id && userData.user.id === userId) {
					return apiResponseLogger(403, 'You cannot delete your own account');
				}

				// Prevent deleting owners unless actor is owner
				const actorPerm = ctx.locals.StudioCMS.security?.userPermissionLevel;
				if (targetUser.permissionsData?.rank === 'owner' && !actorPerm?.isOwner) {
					return apiResponseLogger(403, 'Insufficient privileges to delete an owner account');
				}

				// Prevent deleting the last owner
				if (targetUser.permissionsData?.rank === 'owner') {
					const allUsers = yield* sdk.GET.users.all();
					const ownerCount = allUsers.filter((u) => u.permissionsData?.rank === 'owner').length;
					if (ownerCount <= 1) {
						return apiResponseLogger(403, 'Cannot delete the last owner account');
					}
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
