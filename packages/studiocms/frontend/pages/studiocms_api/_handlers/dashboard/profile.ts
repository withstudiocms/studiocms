/** biome-ignore-all lint/style/noNonNullAssertion: This is fine */
import { Password, User } from 'studiocms:auth/lib';
import { developerConfig } from 'studiocms:config';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { Effect } from 'effect';
import { isValidEmail } from '#schemas/external-schemas';
import { sharedDBErrors, sharedNotifierErrors } from './_shared.js';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * Profile Handlers for the Dashboard API
 */
export const ProfileHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'profile',
	(handlers) =>
		handlers.handle(
			'updateUserProfile',
			Effect.fn(
				function* ({ payload }) {
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

					const [sdk, userData, notifier, pass, userHelper] = yield* Effect.all([
						SDKCore,
						CurrentUser,
						Notifications,
						Password,
						User.pipe(
							Effect.catchAll(() => new DashboardAPIError({ error: 'Failed to access user data' }))
						),
					]);

					if (!userData.isLoggedIn || !userData.userPermissionLevel.isVisitor) {
						return yield* new DashboardAPIError({ error: 'Unauthorized' });
					}

					switch (payload.mode) {
						case 'basic': {
							const data = payload.data;

							if (!data.name || data.name.trim() === '') {
								return yield* new DashboardAPIError({ error: 'Name cannot be empty' });
							}

							if (!data.email || data.email.trim() === '') {
								return yield* new DashboardAPIError({ error: 'Email cannot be empty' });
							}

							if (!data.username || data.username.trim() === '') {
								return yield* new DashboardAPIError({ error: 'Username cannot be empty' });
							}

							const verifyUsernameResponse = yield* userHelper
								.verifyUsernameInput(data.username)
								.pipe(
									Effect.catchAll(
										(err) =>
											new DashboardAPIError({
												error: `Failed to verify username: ${(err as Error).message}`,
											})
									)
								);

							if (verifyUsernameResponse !== true) {
								return yield* new DashboardAPIError({ error: verifyUsernameResponse });
							}

							const checkEmail = isValidEmail(data.email);

							if (!checkEmail.success) {
								return yield* new DashboardAPIError({
									error: `Invalid email address: ${checkEmail.error.message}`,
								});
							}

							const { usernameSearch, emailSearch } =
								yield* sdk.AUTH.user.searchUsersForUsernameOrEmail(data.username, checkEmail.data);

							if (userData.user?.username !== data.username && usernameSearch.length > 0) {
								return yield* new DashboardAPIError({ error: 'Username is already taken' });
							}

							if (userData.user?.email !== data.email && emailSearch.length > 0) {
								return yield* new DashboardAPIError({ error: 'Email is already taken' });
							}

							yield* sdk.AUTH.user.update({
								userId: userData.user!.id,
								userData: { ...data, id: userData.user!.id },
							});

							return {
								message: 'Profile updated successfully',
							};
						}
						case 'password': {
							const data = payload.data;

							const { currentPassword, newPassword, confirmNewPassword } = data;

							if (!currentPassword && userData.user?.password) {
								return yield* new DashboardAPIError({ error: 'Current password is required' });
							}

							if (!newPassword) {
								return yield* new DashboardAPIError({ error: 'New password is required' });
							}

							if (currentPassword && userData.user?.password) {
								const isValid = yield* pass
									.verifyPasswordHash(userData.user.password, currentPassword)
									.pipe(
										Effect.catchAll(
											(err) =>
												new DashboardAPIError({
													error: `Failed to verify current password: ${(err as Error).message}`,
												})
										)
									);
								if (!isValid) {
									return yield* new DashboardAPIError({ error: 'Current password is incorrect' });
								}
							}

							if (!confirmNewPassword) {
								return yield* new DashboardAPIError({ error: 'Please confirm the new password' });
							}

							if (newPassword !== confirmNewPassword) {
								return yield* new DashboardAPIError({
									error: 'New password and confirmation do not match',
								});
							}

							const verifyPasswordResponse = yield* pass.verifyPasswordStrength(newPassword).pipe(
								Effect.catchAll(
									(err) =>
										new DashboardAPIError({
											error: `Failed to verify password strength: ${(err as Error).message}`,
										})
								)
							);

							if (verifyPasswordResponse !== true) {
								return yield* new DashboardAPIError({ error: verifyPasswordResponse });
							}

							const userUpdate = {
								password: yield* pass.hashPassword(newPassword).pipe(
									Effect.catchAll(
										(err) =>
											new DashboardAPIError({
												error: `Failed to hash new password: ${(err as Error).message}`,
											})
									)
								),
							};

							if (userData.user) {
								yield* sdk.AUTH.user.update({
									userId: userData.user.id,
									userData: {
										id: userData.user.id,
										name: userData.user.name,
										username: userData.user.username,
										updatedAt: new Date().toISOString(),
										createdAt: undefined,
										emailVerified: userData.user.emailVerified,
										...userUpdate,
									},
								});

								yield* Effect.all([
									notifier.sendUserNotification('account_updated', userData.user.id),
									notifier.sendAdminNotification('user_updated', userData.user.username),
								]).pipe(
									Effect.catchAll(
										(err) =>
											new DashboardAPIError({
												error: `Failed to send notifications: ${(err as Error).message}`,
											})
									)
								);
							}

							return {
								message: 'Password updated successfully',
							};
						}
						case 'avatar': {
							if (!userData.user?.email) {
								return yield* new DashboardAPIError({
									error: 'User email is required to generate avatar',
								});
							}

							if (userData.user)
								yield* userHelper.createUserAvatar(userData.user.email).pipe(
									Effect.flatMap((newAvatar) =>
										Effect.all([
											sdk.AUTH.user.update({
												userId: userData.user!.id,
												userData: {
													id: userData.user!.id,
													name: userData.user!.name,
													username: userData.user!.username,
													updatedAt: new Date().toISOString(),
													emailVerified: userData.user!.emailVerified,
													createdAt: undefined,
													avatar: newAvatar,
												},
											}),
											notifier.sendUserNotification('account_updated', userData.user!.id).pipe(
												Effect.catchAll(
													(err) =>
														new DashboardAPIError({
															error: `Failed to send user notification: ${(err as Error).message}`,
														})
												)
											),
											notifier.sendAdminNotification('user_updated', userData.user!.username).pipe(
												Effect.catchAll(
													(err) =>
														new DashboardAPIError({
															error: `Failed to send admin notification: ${(err as Error).message}`,
														})
												)
											),
										])
									),
									Effect.catchAll(
										(err) =>
											new DashboardAPIError({
												error: `Failed to create new avatar: ${(err as Error).message}`,
											})
									)
								);

							return {
								message: 'Avatar updated successfully',
							};
						}
						default: {
							return yield* new DashboardAPIError({ error: 'Invalid update mode' });
						}
					}
				},
				Notifications.Provide,
				Effect.catchTags({
					...sharedDBErrors,
					...sharedNotifierErrors,
				})
			)
		)
);
