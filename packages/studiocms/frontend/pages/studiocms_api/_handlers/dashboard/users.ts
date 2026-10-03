import { developerConfig } from 'studiocms:config';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { tsPermissionsSelect } from 'studiocms:sdk/types';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { availablePermissionRanks } from '@withstudiocms/auth-kit/types';
import { Effect } from 'effect';
import { ValidRanks } from '#consts';
import { sharedDBErrors, sharedNotifierErrors } from './_shared.js';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * Users Handlers for the Dashboard API
 */
export const UsersHandlers = HttpApiBuilder.group(StudioCMSDashboardApiSpec, 'users', (handlers) =>
	handlers
		.handle(
			'updateUser',
			Effect.fn(
				function* ({ payload: { id, rank, emailVerified } }) {
					if (!dashboardAPIEnabled) {
						return yield* new DashboardAPIError({
							error: 'Dashboard API is disabled',
						});
					}

					if (developerConfig.demoMode !== false) {
						return yield* new DashboardAPIError({
							error: 'Demo mode is enabled, this action is not allowed.',
						});
					}

					const [sdk, notifier, userData] = yield* Effect.all([
						SDKCore,
						Notifications,
						CurrentUser,
					]);

					if (!userData.isLoggedIn || !userData.userPermissionLevel.isAdmin) {
						return yield* new DashboardAPIError({
							error: 'Unauthorized',
						});
					}

					if (!ValidRanks.has(rank) || rank === 'unknown') {
						return yield* new DashboardAPIError({
							error: 'Invalid permission rank provided.',
						});
					}

					const insertData: tsPermissionsSelect = {
						user: id,
						rank,
					};

					const user = yield* sdk.GET.users.byId(id);

					if (!user) {
						return yield* new DashboardAPIError({
							error: 'User not found.',
						});
					}

					const userPerms = availablePermissionRanks.indexOf(userData.permissionLevel);
					const targetCurrentLevel = availablePermissionRanks.indexOf(
						user.permissionsData?.rank || 'unknown'
					);
					const targetNewLevel = availablePermissionRanks.indexOf(rank);

					if (userPerms === -1 || targetCurrentLevel === -1 || targetNewLevel === -1) {
						return yield* new DashboardAPIError({
							error: 'Invalid permission rank encountered.',
						});
					}

					if (userPerms <= targetCurrentLevel) {
						return yield* new DashboardAPIError({
							error: 'You do not have permission to modify this user.',
						});
					}

					if (userPerms <= targetNewLevel) {
						return yield* new DashboardAPIError({
							error: 'You cannot assign a permission rank equal to or higher than your own.',
						});
					}

					const updatedData = yield* sdk.UPDATE.permissions(insertData);

					if (!updatedData) {
						return yield* new DashboardAPIError({
							error: 'Failed to update user permissions.',
						});
					}

					if (typeof emailVerified === 'boolean') {
						yield* sdk.AUTH.user.update({
							userId: id,
							userData: {
								id,
								name: user.name,
								username: user.username,
								updatedAt: new Date().toISOString(),
								createdAt: undefined,
								emailVerified,
							},
						});
					}

					yield* Effect.all([
						notifier.sendUserNotification('account_updated', id),
						notifier.sendAdminNotification('user_updated', user.username),
					]).pipe(
						Effect.catchAll(
							() =>
								new DashboardAPIError({
									error: 'Failed to send notifications',
								})
						)
					);

					return {
						message: 'User updated successfully.',
					};
				},
				Notifications.Provide,
				Effect.catchTags({
					...sharedDBErrors,
					...sharedNotifierErrors,
				})
			)
		)
		.handle(
			'deleteUser',
			Effect.fn(
				function* ({ payload: { userId, username, usernameConfirm } }) {
					if (!dashboardAPIEnabled) {
						return yield* new DashboardAPIError({
							error: 'Dashboard API is disabled',
						});
					}

					if (developerConfig.demoMode !== false) {
						return yield* new DashboardAPIError({
							error: 'Demo mode is enabled, this action is not allowed.',
						});
					}

					const [sdk, notifier, userData] = yield* Effect.all([
						SDKCore,
						Notifications,
						CurrentUser,
					]);

					if (!userData.isLoggedIn || !userData.userPermissionLevel.isAdmin) {
						return yield* new DashboardAPIError({
							error: 'Unauthorized',
						});
					}

					if (username !== usernameConfirm) {
						return yield* new DashboardAPIError({
							error: 'Username confirmation does not match.',
						});
					}

					const targetUser = yield* sdk.GET.users.byId(userId);

					if (!targetUser) {
						return yield* new DashboardAPIError({
							error: 'User not found',
						});
					}

					if (targetUser.username !== username) {
						return yield* new DashboardAPIError({
							error: 'Username confirmation does not match target user',
						});
					}

					if (userData.user?.id && userData.user.id === userId) {
						return yield* new DashboardAPIError({
							error: 'You cannot delete your own account.',
						});
					}

					const actorPerms = availablePermissionRanks.indexOf(userData.permissionLevel);
					const targetPerms = availablePermissionRanks.indexOf(
						targetUser.permissionsData?.rank || 'unknown'
					);

					if (actorPerms === -1 || targetPerms === -1) {
						return yield* new DashboardAPIError({
							error: 'Invalid permission rank encountered.',
						});
					}

					if (actorPerms <= targetPerms) {
						return yield* new DashboardAPIError({
							error: 'You do not have permission to delete this user.',
						});
					}

					if (targetUser.permissionsData?.rank === 'owner') {
						const allUsers = yield* sdk.GET.users.all();
						const ownerCount = allUsers.filter((u) => u.permissionsData?.rank === 'owner').length;

						if (ownerCount <= 1) {
							return yield* new DashboardAPIError({
								error: 'Cannot delete the last owner account.',
							});
						}
					}

					const deleteResult = yield* sdk.DELETE.user(userId);

					if (!deleteResult) {
						return yield* new DashboardAPIError({
							error: 'Failed to delete user.',
						});
					}

					if (deleteResult.status === 'error') {
						return yield* new DashboardAPIError({
							error: deleteResult.message || 'Failed to delete user.',
						});
					}

					yield* notifier.sendAdminNotification('user_deleted', targetUser.username).pipe(
						Effect.catchAll(
							() =>
								new DashboardAPIError({
									error: 'Failed to send notifications',
								})
						)
					);

					return {
						message: deleteResult.message || 'User deleted successfully.',
					};
				},
				Notifications.Provide,
				Effect.catchTags({
					...sharedDBErrors,
					...sharedNotifierErrors,
				})
			)
		)
		.handle(
			'updateUserNotifications',
			Effect.fn(function* ({ payload: { id, notifications } }) {
				if (!dashboardAPIEnabled) {
					return yield* new DashboardAPIError({
						error: 'Dashboard API is disabled',
					});
				}

				if (developerConfig.demoMode !== false) {
					return yield* new DashboardAPIError({
						error: 'Demo mode is enabled, this action is not allowed.',
					});
				}

				const [sdk, userData] = yield* Effect.all([SDKCore, CurrentUser]);

				if (!userData.isLoggedIn || !userData.userPermissionLevel.isVisitor) {
					return yield* new DashboardAPIError({
						error: 'Unauthorized',
					});
				}

				if (id !== userData.user?.id && !userData.userPermissionLevel.isAdmin) {
					return yield* new DashboardAPIError({
						error: "Unauthorized: cannot modify another user's notification preferences",
					});
				}

				const existingUser = yield* sdk.GET.users.byId(id);

				if (!existingUser) {
					return yield* new DashboardAPIError({
						error: 'User not found',
					});
				}

				const updatedData = yield* sdk.AUTH.user.update({
					userId: id,
					userData: {
						id,
						name: existingUser.name,
						username: existingUser.username,
						updatedAt: new Date().toISOString(),
						emailVerified: existingUser.emailVerified,
						createdAt: undefined,
						notifications,
					},
				});

				if (!updatedData) {
					return yield* new DashboardAPIError({
						error: 'Failed to update user notifications',
					});
				}

				return {
					message: 'User notifications updated successfully',
				};
			}, Effect.catchTags(sharedDBErrors))
		)
);
