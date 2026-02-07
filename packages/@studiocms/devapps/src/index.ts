import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver, injectDevRoute } from 'astro-integration-kit';
import { type StudioCMSDevAppsOptions, StudioCMSDevAppsSchema } from './schema/index.js';
import { pathGenerator } from './utils/pathGenerator.js';

/**
 * Integrates StudioCMS development applications with Astro.
 *
 * @param {StudioCMSDevAppsOptions} [opts] - Optional configuration options for StudioCMS DevApps.
 * @returns {AstroIntegration} The Astro integration object for StudioCMS DevApps.
 *
 * @remarks
 * This function sets up the StudioCMS development applications for use in an Astro project.
 * It parses the provided options, sets up virtual imports, and adds development toolbar apps
 * based on the configuration.
 *
 * The integration is enforced to run only in development mode.
 *
 * @example
 * ```typescript
 * import { studioCMSDevApps } from '@studiocms/devapps';
 *
 * export default {
 *   integrations: [
 *     studioCMSDevApps({
 *       endpoint: '/api',
 *       appsConfig: {
 *         wpImporter: {
 *           enabled: true,
 *           endpoint: '/wp-import',
 *         },
 *       },
 *       verbose: true,
 *     }),
 *   ],
 * };
 * ```
 */
export function studioCMSDevApps(opts?: StudioCMSDevAppsOptions): AstroIntegration {
	// Parse Options
	const options = StudioCMSDevAppsSchema.parse(opts);

	// Resolver for Virtual Imports and Endpoints
	const { resolve } = createResolver(import.meta.url);

	// Endpoint Path Generator placeholder
	let makeEndpointPath: (path: string) => string;

	return {
		name: '@studiocms/devapps',
		hooks: {
			'astro:config:setup': (params) => {
				// Destructure Params
				const { config, logger, addDevToolbarApp, command } = params;

				// Endpoint Path Generator
				makeEndpointPath = pathGenerator(options.endpoint, config.base);

				// Log Setup
				options.verbose && logger.info('Setting up StudioCMS DevApps');

				// Enforce dev mode only
				if (command === 'dev') {
					// Generate Endpoint Paths
					const wpAPIPath = makeEndpointPath(options.appsConfig.wpImporter.endpoint);

					// Add Virtual Imports
					addVirtualImports(params, {
						name: '@studiocms/devapps',
						imports: {
							'virtual:studiocms-devapps/endpoints': `
								export const wpAPIEndpoint = "${wpAPIPath}";
							`,
							'virtual:studiocms-devapps/config': `
								export const userProjectRoot = "${config.root.pathname}";
							`,
						},
					});

					//// Add Dev Toolbar Apps

					// Add WP API Importer App
					if (options.appsConfig.wpImporter.enabled) {
						options.verbose && logger.info('Adding Dev Toolbar App: WP API Importer');

						injectDevRoute(params, {
							entrypoint: resolve('./routes/wp-importer.js'),
							pattern: wpAPIPath,
						});

						addDevToolbarApp({
							name: 'Wordpress API Importer',
							id: 'studiocms-devapps-wp-api-importer',
							entrypoint: resolve('./apps/wp-importer.js'),
							icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2M3.01 12c0-1.3.28-2.54.78-3.66l4.29 11.75c-3-1.46-5.07-4.53-5.07-8.09M12 20.99c-.88 0-1.73-.13-2.54-.37l2.7-7.84l2.76 7.57c.02.04.04.09.06.12c-.93.34-1.93.52-2.98.52m1.24-13.21c.54-.03 1.03-.09 1.03-.09c.48-.06.43-.77-.06-.74c0 0-1.46.11-2.4.11c-.88 0-2.37-.11-2.37-.11c-.48-.02-.54.72-.05.75c0 0 .46.06.94.09l1.4 3.84l-1.97 5.9l-3.27-9.75c.54-.02 1.03-.08 1.03-.08c.48-.06.43-.77-.06-.74c0 0-1.46.11-2.4.11c-.17 0-.37 0-.58-.01C6.1 4.62 8.86 3.01 12 3.01c2.34 0 4.47.89 6.07 2.36c-.04 0-.08-.01-.12-.01c-.88 0-1.51.77-1.51 1.6c0 .74.43 1.37.88 2.11c.34.6.74 1.37.74 2.48c0 .77-.3 1.66-.68 2.91l-.9 3zm6.65-.09a8.99 8.99 0 0 1-3.37 12.08l2.75-7.94c.51-1.28.68-2.31.68-3.22c0-.33-.02-.64-.06-.92"/></svg>',
						});
					}
				}
			},
		},
	};
}

export default studioCMSDevApps;
