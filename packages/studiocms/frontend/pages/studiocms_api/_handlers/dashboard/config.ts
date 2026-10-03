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
 * Handlers for the Dashboard API configuration endpoints.
 */
export const ConfigHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'config',
	(handlers) =>
		handlers.handle(
			'updateSiteConfig',
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

				const isAuthorized = userData.userPermissionLevel.isOwner;

				if (!userData.isLoggedIn || !isAuthorized) {
					return yield* new DashboardAPIError({ error: 'Unauthorized' });
				}

				if (!payload.loginPageBackground) {
					return yield* new DashboardAPIError({
						error: 'Invalid input: loginPageBackground is required',
					});
				}

				if (payload.loginPageBackground === 'custom' && !payload.loginPageCustomImage) {
					return yield* new DashboardAPIError({
						error:
							'Invalid input: loginPageCustomImage is required when loginPageBackground is set to custom',
					});
				}

				yield* sdk.UPDATE.siteConfig(payload);

				return {
					message: 'Site configuration updated successfully',
				};
			}, Effect.catchTags(sharedDBErrors))
		)
);
