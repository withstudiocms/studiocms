import { developerConfig } from 'studiocms:config';
import pluginList from 'studiocms:plugins';
import { settingsEndpoints } from 'studiocms:plugins/endpoints';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { AstroAPIContext, CurrentUser } from '@withstudiocms/api-spec/astro-context';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { Effect, pipe } from 'effect';
import { webHandlerToEffectHttpHandler } from 'effectify/webHandler';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * Plugin Handlers for the Dashboard API
 */
export const PluginHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'plugins',
	(handlers) =>
		handlers.handleRaw(
			'savePluginSettings',
			Effect.fn(
				function* ({ path: { plugin } }) {
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

					const [userData, ctx] = yield* Effect.all([CurrentUser, AstroAPIContext]);

					if (!userData.isLoggedIn || !userData.userPermissionLevel.isAdmin) {
						return yield* new DashboardAPIError({ error: 'Unauthorized' });
					}

					const settingsPage = yield* Effect.try({
						try: () =>
							pipe(
								pluginList.filter(({ settingsPage }) => !!settingsPage),
								(p) => p.find(({ identifier }) => identifier === plugin),
								(p) => {
									if (!p) {
										throw new DashboardAPIError({ error: 'Plugin not found' });
									}
									const exists = settingsEndpoints.find(({ identifier }) => identifier === plugin);
									if (!exists) {
										throw new DashboardAPIError({ error: 'Plugin does not have a settings page' });
									}
									return exists;
								}
							),
						catch: (cause) =>
							new DashboardAPIError({ error: (cause as Error).message || 'Internal Server Error' }),
					});

					if (!settingsPage.onSave) {
						return new DashboardAPIError({ error: 'Plugin does not have a settings page' });
					}

					return yield* webHandlerToEffectHttpHandler(
						settingsPage.onSave(ctx) as unknown as (request: Request) => Promise<Response>
					);
				},
				Effect.catchTags({
					'effectify/webHandler.WebHandlerError': (cause) =>
						new DashboardAPIError({ error: cause.message || 'Internal Server Error' }),
				})
			)
		)
);
