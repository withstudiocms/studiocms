import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { Effect } from 'effect';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

export const CreateHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'create',
	(handlers) =>
		handlers
			.handle('createPasswordResetLink', () => Effect.void)
			.handle('createUser', () => Effect.void)
			.handle('createUserInvite', () => Effect.void)
);
