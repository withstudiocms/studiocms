import { developerConfig } from 'studiocms:config';
import { SDKCore } from 'studiocms:sdk';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { Effect } from 'effect';
import { sharedDBErrors } from './_shared.js';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * Email Notification Handlers for the Dashboard API
 */
export const EmailNotificationHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'emailNotifications',
	(handlers) =>
		handlers.handle(
			'updateEmailNotificationsSettings',
			Effect.fn(function* ({ payload }) {
				if (!dashboardAPIEnabled) {
					return yield* new DashboardAPIError({ error: 'Dashboard API is disabled' });
				}

				if (developerConfig.demoMode !== false) {
					return yield* new DashboardAPIError({
						error: 'Demo mode is enabled, this action is not allowed.',
					});
				}

				const [sdk, userData] = yield* Effect.all([SDKCore, CurrentUser]);

				if (!userData.isLoggedIn || !userData.userPermissionLevel.isOwner) {
					return yield* new DashboardAPIError({ error: 'Unauthorized' });
				}

				yield* sdk.notificationSettings.site.update(payload);

				return {
					message: 'Notification settings updated',
				};
			}, Effect.catchTags(sharedDBErrors))
		)
);
