import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver, injectDevRoute } from 'astro-integration-kit';
import { loadEnv } from 'vite';
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
 *         libSQLViewer: {
 *           enabled: true,
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

	const astroDbEnv = loadEnv('all', process.cwd(), 'ASTRO_DB');

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
					const libsqlIFrame = makeEndpointPath(options.appsConfig.libSQLViewer.endpoint);

					console.log('libsqlIFrame', libsqlIFrame);

					// Add Virtual Imports
					addVirtualImports(params, {
						name: '@studiocms/devapps',
						imports: {
							'virtual:studiocms-devapps/endpoints': `
								export const wpAPIEndpoint = "${wpAPIPath}";
								export const libsqlEndpoint = "${libsqlIFrame}";
							`,
							'virtual:studiocms-devapps/config': `
								export const userProjectRoot = "${config.root.pathname}";

								export const dbEnv = {
									remoteUrl: "${astroDbEnv.ASTRO_DB_REMOTE_URL}",
									token: "${astroDbEnv.ASTRO_DB_APP_TOKEN}",
								};
							`,
							'virtual:studiocms-devapps/db': `
								export * from '${resolve('./db-mod.js')}';
							`,
						},
					});

					//// Add Dev Toolbar Apps

					// Add LibSQL Viewer App
					if (options.appsConfig.libSQLViewer.enabled) {
						options.verbose && logger.info('Adding Dev Toolbar App: LibSQL Viewer');

						injectDevRoute(params, {
							entrypoint: resolve('./routes/outerbase.astro'),
							pattern: libsqlIFrame,
						});

						addDevToolbarApp({
							name: 'Outerbase Studio Embedded',
							id: 'studiocms-devapps-libsql-viewer',
							entrypoint: resolve('./apps/libsql-viewer.js'),
							icon: '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-4 hidden size-4 md:block"><path fill-rule="evenodd" clip-rule="evenodd" d="M20 0C8.97048 0 0 8.96666 0 19.9999C0 31.0227 8.97048 40 20 40C31.0294 40 40 31.0333 40 19.9999C40 8.96666 31.0294 0 20 0ZM27.4346 33.7676L27.3343 33.8966C26.2881 35.1776 25.0082 35.5974 24.1178 35.7158C23.8841 35.748 23.6504 35.759 23.4056 35.759C20.9794 35.759 18.5308 34.112 16.3272 30.9795C14.5353 28.4284 12.9771 25.027 11.9421 21.3992C10.1057 14.9299 10.3172 9.03117 12.4763 6.36169C13.5225 5.08067 14.8024 4.66086 15.6928 4.5425C18.2192 4.19787 20.8013 5.67267 23.1385 8.79421C25.0749 11.3779 26.7445 14.9408 27.8576 18.8481C29.6716 25.2207 29.4935 31.0549 27.4346 33.7676Z" fill="currentColor"></path></svg>',
						});
					}

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
