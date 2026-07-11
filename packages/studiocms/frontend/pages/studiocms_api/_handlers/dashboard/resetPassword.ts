import { Password } from 'studiocms:auth/lib';
import { developerConfig } from 'studiocms:config';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { Effect } from 'effect';
import { sharedDBErrors, sharedNotifierErrors } from './_shared.js';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * Reset Password Handlers for the Dashboard API
 */
export const ResetPasswordHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'resetPassword',
	(handlers) =>
		handlers.handle(
			'resetPassword',
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

					const { token, password, confirm_password } = payload;

					if (password !== confirm_password) {
						return yield* new DashboardAPIError({
							error: 'Passwords do not match',
						});
					}

					const [sdk, notifier, pass] = yield* Effect.all([SDKCore, Notifications, Password]);

					const verifyPasswordResponse = yield* pass.verifyPasswordStrength(password).pipe(
						Effect.catchAll((err) => {
							return new DashboardAPIError({
								error: `Password does not meet strength requirements: ${err.message}`,
							});
						})
					);

					if (verifyPasswordResponse !== true) {
						return yield* new DashboardAPIError({
							error: verifyPasswordResponse,
						});
					}

					const hashedPassword = yield* pass.hashPassword(password).pipe(
						Effect.catchAll(() => {
							return new DashboardAPIError({
								error: 'Failed to hash password',
							});
						})
					);

					const isTokenValid = yield* sdk.resetTokenBucket.check(token);

					if (!isTokenValid) {
						return yield* new DashboardAPIError({
							error: 'Invalid or expired reset token',
						});
					}

					const tokenInfo = yield* sdk.UTIL.Generators.testToken(token);

					if (!tokenInfo?.userId) {
						return yield* new DashboardAPIError({
							error: 'Invalid or expired reset token',
						});
					}

					const targetUserId = tokenInfo.userId as string;

					const userUpdate = {
						password: hashedPassword,
					};

					const userData = yield* sdk.GET.users.byId(targetUserId);

					if (!userData) {
						return yield* new DashboardAPIError({
							error: 'User not found',
						});
					}

					yield* sdk.AUTH.user.update({
						userId: targetUserId,
						userData: {
							id: targetUserId,
							name: userData.name,
							username: userData.username,
							updatedAt: new Date().toISOString(),
							createdAt: undefined,
							emailVerified: userData.emailVerified,
							...userUpdate,
						},
					});

					yield* sdk.resetTokenBucket.delete(targetUserId);

					yield* Effect.all([
						notifier.sendUserNotification('account_updated', targetUserId),
						notifier.sendAdminNotification('user_updated', userData.username),
					]).pipe(
						Effect.catchAll(() => {
							return new DashboardAPIError({
								error: 'Failed to send notifications',
							});
						})
					);

					return {
						message: 'Password updated successfully',
					};
				},
				Notifications.Provide,
				Effect.catchTags({
					...sharedDBErrors,
					...sharedNotifierErrors,
					GeneratorError: () => new DashboardAPIError({ error: 'Invalid or expired reset token' }),
				})
			)
		)
);
