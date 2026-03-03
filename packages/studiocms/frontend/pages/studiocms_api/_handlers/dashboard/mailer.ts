import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { Effect } from 'effect';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

export const MailerHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'mailer',
	(handlers) =>
		handlers
			.handle('setupMailerConfig', () => Effect.void)
			.handle('updateMailerConfig', () => Effect.void)
			.handle('testEmailService', () => Effect.void)
);
