import { runtimeLogger } from '@inox-tools/runtime-logger';
import { createResolver, defineUtility } from 'astro-integration-kit';
import type { StudioCMSDashboardOptions } from '../schema.js';
import { injectDashboardAPIRoutes } from '../utils/addAPIRoutes.js';
import { checkForWebVitals } from '../utils/checkForWebVitalsPlugin.js';
import { injectDashboardRoute } from '../utils/injectRouteArray.js';
import { integrationLogger } from '../utils/integrationLogger.js';

const { resolve } = createResolver(import.meta.url);

const routesDir = {
	asset: (file: string) => resolve(`../../assets/${file}`),
	fts: (file: string) => resolve(`../../assets/firstTimeSetupRoutes/${file}`),
	route: (file: string) => resolve(`../../assets/routes/${file}`),
	api: (file: string) => resolve(`../../assets/routes/studiocms_api/dashboard/${file}`),
};

export const configSetup = defineUtility('astro:config:setup')(
	(params, name: string, options: StudioCMSDashboardOptions) => {
		// Destructure the params object
		const { logger, injectRoute } = params;

		// Destructure the options object
		const {
			verbose,
			dbStartPage,
			dashboardConfig: { dashboardEnabled, inject404Route },
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
				entrypoint: routesDir.fts('main.astro'),
				prerender: false,
			});
			injectRoute({
				pattern: 'done',
				entrypoint: routesDir.fts('done.astro'),
				prerender: false,
			});
		}

		// Inject 404 Route if enabled
		if (shouldInject404Route) {
			integrationLogger({ logger, logLevel: 'info', verbose }, 'Injecting 404 Route...');
			injectRoute({
				pattern: '404',
				entrypoint: routesDir.route('404.astro'),
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
					entrypoint: routesDir.api('LiveRender.astro'),
				},
				{
					enabled: dashboardEnabled && !dbStartPage,
					pattern: 'search-list',
					entrypoint: routesDir.api('search-list.ts'),
				},
				{
					enabled: dashboardEnabled && !dbStartPage,
					pattern: 'user-list-items',
					entrypoint: routesDir.api('UserListItems.astro'),
				},
				// {
				// 	enabled: dashboardEnabled && !dbStartPage && authEnabled,
				// 	pattern: 'config/site',
				// 	entrypoint: resolve('../../assets/routes/studiocms_api/config/site.ts'),
				// },
				// {
				// 	enabled: dashboardEnabled && !dbStartPage && authEnabled,
				// 	pattern: 'config/admin',
				// 	entrypoint: resolve('../../assets/routes/studiocms_api/config/admin.ts'),
				// },
				// {
				// 	enabled: dashboardEnabled && !dbStartPage && authEnabled,
				// 	pattern: 'pages/create',
				// 	entrypoint: resolve('../../assets/routes/studiocms_api/pages/create.ts'),
				// },
				// {
				// 	enabled: dashboardEnabled && !dbStartPage && authEnabled,
				// 	pattern: 'pages/edit',
				// 	entrypoint: resolve('../../assets/routes/studiocms_api/pages/edit.ts'),
				// },
				// {
				// 	enabled: dashboardEnabled && !dbStartPage && authEnabled,
				// 	pattern: 'pages/delete',
				// 	entrypoint: resolve('../../assets/routes/studiocms_api/pages/delete.ts'),
				// },
				{
					enabled: dbStartPage,
					pattern: 'setup',
					entrypoint: routesDir.fts('firstTimeSetup.ts'),
				},
			],
		});

		// Inject Routes
		injectDashboardRoute(
			params,
			{
				options,
				routes: [
					{
						enabled: dashboardEnabled && !dbStartPage,
						pattern: '/',
						entrypoint: routesDir.route('index.astro'),
					},
					{
						enabled: dashboardEnabled && !dbStartPage,
						pattern: 'content-management',
						entrypoint: routesDir.route('content-management/index.astro'),
					},
					{
						enabled: dashboardEnabled && !dbStartPage,
						pattern: 'content-management/create',
						entrypoint: routesDir.route('content-management/createpage.astro'),
					},
					{
						enabled: dashboardEnabled && !dbStartPage,
						pattern: 'content-management/create-folder',
						entrypoint: routesDir.route('content-management/createfolder.astro'),
					},
					{
						enabled: dashboardEnabled && !dbStartPage,
						pattern: 'content-management/edit',
						entrypoint: routesDir.route('content-management/editpage.astro'),
					},
					{
						enabled: dashboardEnabled && !dbStartPage,
						pattern: 'content-management/edit-folder',
						entrypoint: routesDir.route('content-management/editfolder.astro'),
					},
					{
						enabled: dashboardEnabled && !dbStartPage,
						pattern: 'profile',
						entrypoint: routesDir.route('profile.astro'),
					},
					{
						enabled: dashboardEnabled && !dbStartPage,
						pattern: 'configuration',
						entrypoint: routesDir.route('configuration.astro'),
					},
					{
						enabled: dashboardEnabled && !dbStartPage,
						pattern: 'user-management',
						entrypoint: routesDir.route('user-management/index.astro'),
					},
					{
						enabled: dashboardEnabled && !dbStartPage,
						pattern: 'user-management/edit',
						entrypoint: routesDir.route('user-management/edit.astro'),
					},
				],
			},
			false
		);

		// Log that the setup is complete
		integrationLogger({ logger, logLevel: 'info', verbose }, 'StudioCMS Dashboard complete!');
	}
);

export default configSetup;
