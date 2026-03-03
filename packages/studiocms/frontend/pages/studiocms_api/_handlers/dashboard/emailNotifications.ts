import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { Effect } from 'effect';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

export const EmailNotificationHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'emailNotifications',
	(handlers) => handlers.handle('updateEmailNotificationsSettings', () => Effect.void)
);
