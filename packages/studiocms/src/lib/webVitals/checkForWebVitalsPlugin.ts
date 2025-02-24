import {
	addVirtualImports,
	createResolver,
	defineUtility,
	hasIntegration,
} from 'astro-integration-kit';
import type { StudioCMSPlugin } from '../../plugins.js';
import { integrationLogger } from '../../utils/integrationLogger.js';

export const webVitalsName = '@astrojs/web-vitals';

const { resolve } = createResolver(import.meta.url);

/**
 * Checks for the presence of the Web Vitals integration and sets up the necessary configurations.
 *
 * @param params - The parameters provided by the Astro configuration setup.
 * @param opts - Options for configuring the Web Vitals integration.
 * @param opts.name - The name of the Web Vitals integration.
 * @param opts.verbose - A flag indicating whether to log verbose messages.
 * @param opts.version - The minimum version of StudioCMS required for the Web Vitals integration.
 *
 * @returns A StudioCMSPlugin object if the Web Vitals integration is enabled, otherwise null.
 */
export const checkForWebVitals = defineUtility('astro:config:setup')(
	(
		params,
		opts: {
			name: string;
			verbose: boolean;
			version: string;
		}
	) => {
		integrationLogger(
			{ logger: params.logger, logLevel: 'info', verbose: opts.verbose },
			`Checking for '${webVitalsName}' integration...`
		);

		const enabled = hasIntegration(params, { name: webVitalsName });

		// Check for Web Vitals
		if (enabled) {
			// Log that the Web Vitals Integration is Present
			integrationLogger(
				{ logger: params.logger, logLevel: 'info', verbose: opts.verbose },
				'Web Vitals Integration Found!'
			);
		} else {
			// Log that the Web Vitals Integration is Missing
			integrationLogger(
				{ logger: params.logger, logLevel: 'info', verbose: opts.verbose },
				`Web Vitals integration not found. If you wish to use Web Vitals, please install the '${webVitalsName}' package.`
			);
		}

		// Add the Web Vitals StudioCMS interface
		addVirtualImports(params, {
			name: opts.name,
			imports: {
				'studiocms-dashboard:web-vitals': `
					export * from "${resolve('./webVital.js')}"
				`,
			},
		});

		// TODO: Dashboard Grid Items
		//         - Page Visits
		const webVitalsPlugin: StudioCMSPlugin = {
			name: 'Astro Web Vitals',
			identifier: webVitalsName,
			studiocmsMinimumVersion: opts.version,
			dashboardGridItems: [
				{
					name: 'core-web-vitals',
					span: 2,
					variant: 'default',
					header: {
						title: 'Core Web Vitals',
						icon: 'chart-pie',
					},
					body: {
						html: '<corevitals></corevitals>',
						components: {
							corevitals: resolve('./dashboard-grid-items/CoreVitals.astro'),
						},
					},
				},
			],
			dashboardPages: {
				admin: [
					{
						title: {
							'en-us': 'Analytics and Vitals',
						},
						icon: 'chart-pie',
						route: 'analytics',
						description: 'View the Core Web Vitals and Analytics of your site.',
						sidebar: 'single',
						pageBodyComponent: resolve('./pages/analytics/body.astro'),
						pageHeaderComponent: resolve('./pages/analytics/header.astro'),
						requiredPermissions: 'admin',
					},
				],
			},
		};

		if (enabled) {
			return webVitalsPlugin;
		}

		return null;
	}
);
