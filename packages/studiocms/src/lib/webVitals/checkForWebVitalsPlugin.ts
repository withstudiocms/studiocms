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
		};

		if (enabled) {
			return webVitalsPlugin;
		}

		return null;
	}
);
