import { runtimeLogger } from '@inox-tools/runtime-logger';
import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { DashboardStrings, DbErrors } from '@studiocms/core/strings';
import type { InjectedType } from 'astro';
import { createResolver, defineIntegration } from 'astro-integration-kit';
import { name } from '../package.json';
import { StudioCMSDashboardOptionsSchema } from './schema';
import { injectDashboardAPIRoutes } from './utils/addAPIRoutes';
import { checkForWebVitals } from './utils/checkForWebVitalsPlugin';
import { injectRouteArray } from './utils/injectRouteArray';

export default defineIntegration({
	name,
	optionsSchema: StudioCMSDashboardOptionsSchema,
	setup({ name, options }) {
		// Create resolver relative to this file
		const { resolve } = createResolver(import.meta.url);

		// Declaration for Web Vitals DTS File
		let WEBVITALSDTSFILE: InjectedType;

		return {
			hooks: {
				'astro:config:setup': async (params) => {
					// Destructure Params
					const { logger } = params;

					// Destructure Options
					const { verbose } = options;

					// Log that the setup has started
					integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.Setup);

					// Inject `@it-astro:logger:{name}` Logger for runtime logging
					runtimeLogger(params, { name: 'studiocms-dashboard' });

					// Inject API Routes
					injectDashboardAPIRoutes(params, {
						options,
						routes: [
							{
								enabled: options.dashboardConfig.dashboardEnabled && !options.dbStartPage,
								pattern: 'liverender',
								entrypoint: resolve('./routes/studiocms_api/LiveRender.astro'),
							},
							{
								enabled:
									options.dashboardConfig.dashboardEnabled &&
									!options.dbStartPage &&
									options.dashboardConfig.AuthConfig.enabled,
								pattern: 'config/site',
								entrypoint: resolve('./routes/studiocms_api/config/site.ts'),
							},
							{
								enabled:
									options.dashboardConfig.dashboardEnabled &&
									!options.dbStartPage &&
									options.dashboardConfig.AuthConfig.enabled,
								pattern: 'config/admin',
								entrypoint: resolve('./routes/studiocms_api/config/admin.ts'),
							},
							{
								enabled:
									options.dashboardConfig.dashboardEnabled &&
									!options.dbStartPage &&
									options.dashboardConfig.AuthConfig.enabled,
								pattern: 'pages/create',
								entrypoint: resolve('./routes/studiocms_api/pages/create.ts'),
							},
							{
								enabled:
									options.dashboardConfig.dashboardEnabled &&
									!options.dbStartPage &&
									options.dashboardConfig.AuthConfig.enabled,
								pattern: 'pages/edit',
								entrypoint: resolve('./routes/studiocms_api/pages/edit.ts'),
							},
							{
								enabled:
									options.dashboardConfig.dashboardEnabled &&
									!options.dbStartPage &&
									options.dashboardConfig.AuthConfig.enabled,
								pattern: 'pages/delete',
								entrypoint: resolve('./routes/studiocms_api/pages/delete.ts'),
							},
						],
					});

					// Inject Routes
					injectRouteArray(params, {
						options,
						routes: [
							{
								enabled: options.dbStartPage,
								pattern: 'start',
								entrypoint: resolve('./firstTimeSetupRoutes/main.astro'),
								_non_dashboard: true,
							},
							{
								enabled: options.dbStartPage,
								pattern: 'done',
								entrypoint: resolve('./firstTimeSetupRoutes/done.astro'),
								_non_dashboard: true,
							},
							{
								enabled: options.dbStartPage,
								pattern: 'api/setup',
								entrypoint: resolve('./routes/api/firstTimeSetup.ts'),
								_non_dashboard: true,
							},
							{
								enabled: options.dashboardConfig.dashboardEnabled && !options.dbStartPage,
								pattern: '/',
								entrypoint: resolve('./routes/index.astro'),
							},
							{
								enabled: options.dashboardConfig.dashboardEnabled && !options.dbStartPage,
								pattern: 'profile/',
								entrypoint: resolve('./routes/profile.astro'),
							},
							{
								enabled: options.dashboardConfig.dashboardEnabled && !options.dbStartPage,
								pattern: 'configuration',
								entrypoint: resolve('./routes/configuration/index.astro'),
							},
							{
								enabled: options.dashboardConfig.dashboardEnabled && !options.dbStartPage,
								pattern: 'configuration/admins',
								entrypoint: resolve('./routes/configuration/admins.astro'),
							},
							{
								enabled: options.dashboardConfig.dashboardEnabled && !options.dbStartPage,
								pattern: 'new/page',
								entrypoint: resolve('./routes/create-page.astro'),
							},
							{
								enabled: options.dashboardConfig.dashboardEnabled && !options.dbStartPage,
								pattern: 'page-list',
								entrypoint: resolve('./routes/page-list.astro'),
							},
							{
								enabled: options.dashboardConfig.dashboardEnabled && !options.dbStartPage,
								pattern: 'edit/pages/[...id]',
								entrypoint: resolve('./routes/edit-pages/[...id].astro'),
							},
							{
								enabled: options.dashboardConfig.dashboardEnabled && !options.dbStartPage,
								pattern: 'delete/pages/[...id]',
								entrypoint: resolve('./routes/delete-pages/[...id].astro'),
							},
						],
					});

					// Check for `@astrojs/web-vitals` Integration
					const { webVitalDtsFile } = checkForWebVitals(params, { name, verbose });

					// Set the Web Vitals DTS File
					WEBVITALSDTSFILE = webVitalDtsFile;

					// Log that the setup is complete
					integrationLogger({ logger, logLevel: 'info', verbose }, DashboardStrings.SetupComplete);
				},
				'astro:config:done': async ({ injectTypes }) => {
					// Inject the Web Vitals DTS File
					injectTypes(WEBVITALSDTSFILE);
				},
				'astro:server:start': async ({ logger }) => {
					// Display Console Message if dbStartPage(First Time DB Initialization) is enabled
					if (options.dbStartPage) {
						integrationLogger({ logger, logLevel: 'warn', verbose: true }, DbErrors.DbStartPage);
					}
				},
			},
		};
	},
});
