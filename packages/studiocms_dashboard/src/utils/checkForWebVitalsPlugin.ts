import {
	addVirtualImports,
	createResolver,
	defineUtility,
	hasIntegration,
} from 'astro-integration-kit';
import { integrationLogger } from './integrationLogger.js';

const { resolve } = createResolver(import.meta.url);

export const checkForWebVitals = defineUtility('astro:config:setup')(
	(
		params,
		opts: {
			name: string;
			verbose: boolean;
		}
	) => {
		integrationLogger(
			{ logger: params.logger, logLevel: 'info', verbose: opts.verbose },
			"Checking for '@astrojs/web-vitals' integration..."
		);

		// Check for Web Vitals
		if (hasIntegration(params, { name: '@astrojs/web-vitals' })) {
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
	}
);
