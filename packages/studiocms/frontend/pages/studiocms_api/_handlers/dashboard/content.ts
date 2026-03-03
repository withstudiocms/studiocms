import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { Effect } from 'effect';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

export const ContentHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'content',
	(handlers) =>
		handlers
			.handle('createFolder', () => Effect.void)
			.handle('deleteFolder', () => Effect.void)
			.handle('updateFolder', () => Effect.void)
			.handle('createPage', () => Effect.void)
			.handle('deletePage', () => Effect.void)
			.handle('updatePage', () => Effect.void)
			.handle('revertToDiff', () => Effect.void)
);
