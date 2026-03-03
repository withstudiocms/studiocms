import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { Effect } from 'effect';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

export const PluginHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'plugins',
	(handlers) => handlers.handle('savePluginSettings', () => Effect.void)
);
