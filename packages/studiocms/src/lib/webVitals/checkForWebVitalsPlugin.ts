import {
	addVirtualImports,
	createResolver,
	defineUtility,
	hasIntegration,
} from 'astro-integration-kit';
import { integrationLogger } from '../../utils/integrationLogger.js';
import type { StudioCMSPlugin } from '../../plugins.js';

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
			"Checking for '@astrojs/web-vitals' integration..."
		);

		const enabled = hasIntegration(params, { name: '@astrojs/web-vitals' });

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
				'Web Vitals integration not found. If you wish to use Web Vitals, please install the `@astrojs/web-vitals` package.'
			);
		}

		// Add the Web Vitals StudioCMS interface
		addVirtualImports(params, {
			name: opts.name,
			imports: {
				'studiocms-dashboard:web-vitals': `export * from "${resolve('./webVital.ts')}"`,
			},
		});

		const webVitalsPlugin: StudioCMSPlugin = {
			identifier: '@astrojs/web-vitals',
			name: 'Astro Web Vitals',
			studiocmsMinimumVersion: opts.version,
		}

		if (enabled) {
			return webVitalsPlugin;
		}

		return null;
	}
);
