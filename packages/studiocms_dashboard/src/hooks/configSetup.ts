import { runtimeLogger } from '@inox-tools/runtime-logger';
import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { createResolver, defineUtility } from 'astro-integration-kit';
import type { StudioCMSDashboardOptions } from '../schema';
import { injectDashboardAPIRoutes } from '../utils/addAPIRoutes';
import { checkForWebVitals } from '../utils/checkForWebVitalsPlugin';
import { injectDashboardRoute } from '../utils/injectRouteArray';

const { resolve } = createResolver(import.meta.url);

export const configSetup = defineUtility('astro:config:setup')(
	(params, name: string, options: StudioCMSDashboardOptions) => {
		// Destructure the params object
		const { logger, injectRoute } = params;

		// Destructure the options object
		const {
			verbose,
			dbStartPage,
			dashboardConfig: {
				dashboardEnabled,
				inject404Route,
				AuthConfig: { enabled: authEnabled },
			},
		} = options;

		const shouldInject404Route = inject404Route && dashboardEnabled;

		// Log that the setup has started
		integrationLogger({ logger, logLevel: 'info', verbose }, 'Setting up StudioCMS Dashboard...');

		// Inject `@it-astro:logger:{name}` Logger for runtime logging
		runtimeLogger(params, { name: 'studiocms-dashboard' });

		// Check for `@astrojs/web-vitals` Integration
		checkForWebVitals(params, { name, verbose });

		// Inject First Time Setup Routes if dbStartPage is enabled
		if (dbStartPage) {
			integrationLogger(
				{ logger, logLevel: 'info', verbose },
				'Injecting First Time Setup Routes...'
			);
			injectRoute({
				pattern: 'start',
				entrypoint: resolve('../firstTimeSetupRoutes/main.astro'),
				prerender: false,
			});
			injectRoute({
				pattern: 'done',
				entrypoint: resolve('../firstTimeSetupRoutes/done.astro'),
				prerender: false,
			});
		}

		// Inject 404 Route if enabled
		if (shouldInject404Route) {
			integrationLogger({ logger, logLevel: 'info', verbose }, 'Injecting 404 Route...');
			injectRoute({
				pattern: '404',
				entrypoint: resolve('../routes/404.astro'),
				prerender: true,
			});
		}

		// Inject API Routes
		injectDashboardAPIRoutes(params, {
			options,
			routes: [
				{
					enabled: dashboardEnabled && !dbStartPage,
					pattern: 'liverender',
					entrypoint: resolve('../routes/studiocms_api/LiveRender.astro'),
				},
				{
					enabled: dashboardEnabled && !dbStartPage && authEnabled,
					pattern: 'config/site',
					entrypoint: resolve('../routes/studiocms_api/config/site.ts'),
				},
				{
					enabled: dashboardEnabled && !dbStartPage && authEnabled,
					pattern: 'config/admin',
					entrypoint: resolve('../routes/studiocms_api/config/admin.ts'),
				},
				{
					enabled: dashboardEnabled && !dbStartPage && authEnabled,
					pattern: 'pages/create',
					entrypoint: resolve('../routes/studiocms_api/pages/create.ts'),
				},
				{
					enabled: dashboardEnabled && !dbStartPage && authEnabled,
					pattern: 'pages/edit',
					entrypoint: resolve('../routes/studiocms_api/pages/edit.ts'),
				},
				{
					enabled: dashboardEnabled && !dbStartPage && authEnabled,
					pattern: 'pages/delete',
					entrypoint: resolve('../routes/studiocms_api/pages/delete.ts'),
				},
				{
					enabled: dbStartPage,
					pattern: 'setup',
					entrypoint: resolve('../routes/studiocms_api/firstTimeSetup.ts'),
				},
			],
		});

		// Inject Routes
		injectDashboardRoute(params, {
			options,
			routes: [
				{
					enabled: dashboardEnabled && !dbStartPage,
					pattern: '/',
					entrypoint: resolve('../routes/index.astro'),
				},
				{
					enabled: dashboardEnabled && !dbStartPage,
					pattern: '/test',
					entrypoint: resolve('../routes/test.astro'),
				},
				// {
				// 	enabled: dashboardEnabled && !dbStartPage,
				// 	pattern: '/content-management',
				// 	entrypoint: resolve('../routes/content-management.astro'),
				// },
				// {
				// 	enabled: dashboardEnabled && !dbStartPage,
				// 	pattern: '/create-page',
				// 	entrypoint: resolve('../routes/create-page.astro'),
				// },
				// {
				// 	enabled: dashboardEnabled && !dbStartPage,
				// 	pattern: '/profile',
				// 	entrypoint: resolve('../routes/profile.astro'),
				// },
				// {
				// 	enabled: dashboardEnabled && !dbStartPage,
				// 	pattern: '/configuration',
				// 	entrypoint: resolve('../routes/configuration.astro'),
				// },
				// {
				// 	enabled: dashboardEnabled && !dbStartPage,
				// 	pattern: '/user-management',
				// 	entrypoint: resolve('../routes/user-management.astro'),
				// },
			],
		});

		// Log that the setup is complete
		integrationLogger(
			{ logger, logLevel: 'info', verbose },
			'StudioCMS Dashboard is Setup and Ready to Go!'
		);
	}
);

export default configSetup;
