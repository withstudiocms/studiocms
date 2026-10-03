import { developerConfig } from 'studiocms:config';
import { Mailer } from 'studiocms:mailer';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DashboardAPIError, type MailerSmtpConfigPayload } from '@withstudiocms/api-spec/dashboard';
import { Effect } from 'effect';
import type { DynamicHttpApiHandlerParams } from 'effectify/httpApi';
import { sharedDBErrors, sharedNotifierErrors } from './_shared.js';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * Shared effect for handling both setup and update mailer configuration endpoints since they have the same logic and requirements.
 */
const mailerEffect = (type: 'setup' | 'update') =>
	Effect.fn(
		function* ({
			payload,
		}: DynamicHttpApiHandlerParams<{
			payloadSchema: typeof MailerSmtpConfigPayload.Type;
		}>) {
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

			const [mailer, userData] = yield* Effect.all([Mailer, CurrentUser]);

			if (!userData.isLoggedIn || !userData.userPermissionLevel.isOwner) {
				return yield* new DashboardAPIError({ error: 'Unauthorized' });
			}

			if (payload.port && (payload.port < 1 || payload.port > 65535)) {
				return yield* new DashboardAPIError({ error: 'Invalid port number' });
			}

			const config = yield* mailer.createMailerConfigTable(payload);

			if (!config) {
				return yield* new DashboardAPIError({
					error: `Failed to ${type} mailer configuration`,
				});
			}

			return {
				message: `Mailer configuration ${type}d successfully`,
			};
		},
		Mailer.Provide,
		Effect.catchTags({
			...sharedDBErrors,
			...sharedNotifierErrors,
		})
	);

/**
 * Mailer Handlers for the Dashboard API
 */
export const MailerHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'mailer',
	(handlers) =>
		handlers
			.handle('setupMailerConfig', mailerEffect('setup'))
			.handle('updateMailerConfig', mailerEffect('update'))
			.handle(
				'testEmailService',
				Effect.fn(
					function* ({ payload: { test_email } }) {
						if (!dashboardAPIEnabled) {
							return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
						}

						if (developerConfig.demoMode !== false) {
							return yield* new DashboardAPIError({
								error: 'Demo mode is enabled, this action is not allowed.',
							});
						}

						const [mailer, userData] = yield* Effect.all([Mailer, CurrentUser]);

						if (!userData.isLoggedIn || !userData.userPermissionLevel.isOwner) {
							return yield* new DashboardAPIError({ error: 'Unauthorized' });
						}

						if (typeof test_email !== 'string' || test_email.trim() === '') {
							return yield* new DashboardAPIError({
								error: 'Invalid form data, test_email is required',
							});
						}
						const email = test_email.trim();
						if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
							return yield* new DashboardAPIError({ error: 'Invalid email address' });
						}

						const response = yield* mailer
							.sendMail({
								to: test_email,
								subject: 'StudioCMS Test Email',
								text: 'This is a test email from StudioCMS.',
							})
							.pipe(
								Effect.catchAll(
									(err) =>
										new DashboardAPIError({ error: `Failed to send test email: ${err.message}` })
								)
							);

						if ('error' in response) {
							console.error('Mailer test-email failed:', response.error);
							return yield* new DashboardAPIError({ error: 'Failed to send test email' });
						}
						return {
							message: 'Test email sent successfully',
						};
					},
					Mailer.Provide,
					Effect.catchTags({
						...sharedDBErrors,
						...sharedNotifierErrors,
					})
				)
			)
);
