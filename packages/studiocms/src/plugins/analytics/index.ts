import { runEffect } from '@withstudiocms/effect';
import createPathResolver from '@withstudiocms/internal_helpers/pathResolver';
import type { AstroIntegration } from 'astro';
import { addVirtualImports } from 'astro-integration-kit';
import type { DbDialectType } from '#db/index';
import { KyselyTableManager } from '#db/plugins';
import { buildTranslations, loadJsTranslations } from '#plugins';
import { definePlugin } from '#schemas';
import { WEB_VITALS_ENDPOINT_PATH } from './consts.js';
import { getAnalyticsDbClient } from './db-client.js';
import { StudioCMSMetricTableDefinition } from './table.js';

const { resolve } = createPathResolver(import.meta.url);

/**
 * Resolves a path within the analytics plugin.
 *
 * @param path - The relative path to resolve.
 * @returns The resolved absolute path.
 */
const resolvePath = (path: string) => `studiocms/frontend/web-vitals/${path}`;

/**
 * Loaded translations for the analytics plugin.
 */
const translations = await loadJsTranslations('./i18n', import.meta.url);

/**
 * Built translations for the analytics plugin.
 */
const t = await buildTranslations(translations);

/**
 * Package name for the analytics plugin.
 */
const pkgName = 'studiocms/analytics';

/**
 * Astro Integration for Web Vitals analytics.
 *
 * @returns An AstroIntegration that sets up middleware, endpoint, and client script for Web Vitals.
 */
const webVitalsIntegration = (): AstroIntegration => {
	return {
		name: pkgName,
		hooks: {
			'astro:config:setup': (params) => {
				const { addMiddleware, injectRoute, injectScript } = params;

				// Middleware that adds a `<meta>` tag to each page.
				addMiddleware({ entrypoint: resolvePath('middleware.ts'), order: 'post' });

				// Endpoint that collects metrics and inserts them in Astro DB.
				injectRoute({
					entrypoint: resolvePath('endpoint.ts'),
					pattern: `${WEB_VITALS_ENDPOINT_PATH}/[...any]`,
					prerender: false,
				});

				// Client-side performance measurement script.
				injectScript('page', `import '${resolve('./client-script.js')}';`);

				// Virtual import for dashboard web vitals components and data fetching.
				addVirtualImports(params, {
					name: pkgName,
					imports: {
						'studiocms-dashboard:web-vitals': `
                            export * from '${resolve('./assets/webVital.js')}';
                        `,
					},
				});
			},
		},
	};
};

/**
 * StudioCMS Analytics Plugin to collect Web Vitals metrics and store them in the database.
 *
 * @param driverDialect - The database dialect to use for the analytics database client.
 * @returns A StudioCMSPlugin configured for Web Vitals analytics.
 */
export const studioCMSAnalyticsPlugin = (opts: { driverDialect: DbDialectType; version: string }) =>
	definePlugin({
		name: 'Web Vitals (built-in)',
		identifier: pkgName,
		studiocmsMinimumVersion: opts.version,
		hooks: {
			'studiocms:astro-config': async ({ addIntegrations }) => {
				// Get the database client for the specified dialect.
				const dbClient = await runEffect(getAnalyticsDbClient(opts.driverDialect));

				// Initialize the table manager
				const tableManager = new KyselyTableManager(dbClient.db, {
					tableDefinition: StudioCMSMetricTableDefinition,
					logLabel: 'studiocms:analytics',
				});

				// Ensure the metrics table exists
				await tableManager.initialize();

				// Add the web vitals integration to Astro
				addIntegrations(webVitalsIntegration());
			},
			'studiocms:dashboard': ({ setDashboard }) => {
				setDashboard({
					translations,
					dashboardGridItems: [
						{
							name: 'core-web-vitals',
							span: 2,
							variant: 'default',
							header: {
								// biome-ignore lint/style/noNonNullAssertion: this is okay
								title: t.getComponent('en', 'core-web-vitals')!.title,
								icon: 'heroicons:chart-pie',
							},
							body: {
								html: '<corevitals></corevitals>',
								components: {
									corevitals: resolve('./assets/dashboard-grid-items/CoreVitals.astro'),
								},
							},
						},
					],
					dashboardPages: {
						admin: [
							{
								title: t.buildPageTitle('@page/analytics', 'title'),
								icon: 'heroicons:chart-pie',
								route: 'analytics',
								// biome-ignore lint/style/noNonNullAssertion: this is okay
								description: t.getComponent('en', '@page/analytics')!.description,
								sidebar: 'single',
								pageBodyComponent: resolve('./assets/pages/analytics/body.astro'),
								requiredPermissions: 'admin',
							},
						],
					},
				});
			},
		},
	});
