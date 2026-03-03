import { SDKCore } from 'studiocms:sdk';
import templateEngine from 'studiocms:template-engine';
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
 * Templates Handlers for the Dashboard API
 */
export const TemplatesHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'templates',
	(handlers) =>
		handlers.handle(
			'updateEmailTemplates',
			Effect.fn(
				function* ({ payload }) {
					if (!dashboardAPIEnabled) {
						return yield* new DashboardAPIError({
							error: 'Dashboard API is disabled',
						});
					}

					const [sdk, engine, userData] = yield* Effect.all([SDKCore, templateEngine, CurrentUser]);

					if (!userData.isLoggedIn || !userData.userPermissionLevel.isAdmin) {
						return yield* new DashboardAPIError({ error: 'Unauthorized' });
					}

					const keys = engine.availableTemplates;
					type Keys = (typeof keys)[number];
					const updates: Partial<Record<Keys, string>> = {};
					for (const key of keys) {
						if (key in payload) {
							updates[key] = payload[key];
						}
					}

					if (Object.keys(updates).length === 0) {
						return yield* new DashboardAPIError({
							error: 'No valid templates provided for update.',
						});
					}

					const updatedConfig = yield* sdk.CONFIG.templateConfig.update(updates);

					if (!updatedConfig) {
						return yield* new DashboardAPIError({ error: 'Failed to update templates.' });
					}

					return {
						message: 'Templates updated successfully',
					};
				},
				Effect.catchTags({
					...sharedDBErrors,
					TemplateEngineError: (cause) =>
						new DashboardAPIError({ error: cause.message || 'Template Engine Error' }),
					DeepmergeError: (cause) =>
						new DashboardAPIError({
							error: cause.message || 'Failed to merge template config updates',
						}),
				})
			)
		)
);
