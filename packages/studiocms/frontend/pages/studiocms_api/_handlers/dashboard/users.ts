import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { Effect } from 'effect';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

export const UsersHandlers = HttpApiBuilder.group(StudioCMSDashboardApiSpec, 'users', (handlers) =>
	handlers
		.handle('updateUser', () => Effect.void)
		.handle('deleteUser', () => Effect.void)
		.handle('updateUserNotifications', () => Effect.void)
);
