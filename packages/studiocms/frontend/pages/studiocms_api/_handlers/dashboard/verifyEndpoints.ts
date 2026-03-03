import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { Effect } from 'effect';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

export const VerifyEndpointsHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'verifyEndpoints',
	(handlers) =>
		handlers
			.handle('verifyEmail', () => Effect.void)
			.handle('verifySession', () => Effect.void)
			.handle('resendVerifyEmail', () => Effect.void)
);
