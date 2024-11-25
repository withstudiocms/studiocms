import {
	addVirtualImports,
	createResolver,
	defineIntegration,
	injectDevRoute,
} from 'astro-integration-kit';
import { name, version } from '../package.json';
import { optionsSchema } from './schema';
import { pathGenerator } from './utils/pathGenerator';

// Main Integration
export default defineIntegration({
	name,
	optionsSchema,
	setup({
		name,
		options: {
			endpointPath,
			appsConfig: { libSQLViewer, wpApiImporter },
			verbose,
		},
	}) {
		const { resolve } = createResolver(import.meta.url);

		// Generate Endpoint Path
		const EndpointPath = pathGenerator(endpointPath);

		const WP_API_URL = EndpointPath(wpApiImporter.endpoint);

		return {
			hooks: {
				'astro:config:setup': async (params) => {
					// Destructure Params
					const { logger, addDevToolbarApp, command, config } = params;

					// Log
					logger.info(`Starting, Version: ${version}`);

					// Log Verbose
					if (verbose) {
						logger.info(`[${name}] Verbose Mode`);
					}

					// Get Astro Project Root
					const root = config.root.pathname;

					logger.info(`Root: ${root}`);

					// Enforce dev mode only
					if (command === 'dev') {
						// Add Virtual Imports for app configs
						addVirtualImports(params, {
							name,
							imports: {
								'virtual:studiocms-devapps/libsql-viewer': `export default ${JSON.stringify({ endpointPath: EndpointPath(libSQLViewer.endpoint) })};`,
								'virtual:studiocms-devapps/wp-api/configPath': `export default ${JSON.stringify({ projectRoot: root })};`,
								'virtual:studiocms-devapps/wp-api-importer': `export default ${JSON.stringify({ endpointPath: WP_API_URL })};`,
							},
						});

						//// Add Dev Toolbar Apps

						// libSQLViewer
						if (libSQLViewer.enabled) {
							verbose && logger.info('Adding Dev Toolbar App: libSQLViewer');
							injectDevRoute(params, {
								entrypoint: resolve('routes/libsql-viewer.astro'),
								pattern: EndpointPath(libSQLViewer.endpoint),
							});
							addDevToolbarApp({
								name: 'libSQL Viewer',
								id: 'libsql-viewer',
								icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>`,
								entrypoint: resolve('./apps/libsqlViewer'),
							});
						}

						// WP-API Importer
						if (wpApiImporter.enabled) {
							verbose && logger.info('Adding Dev Toolbar App: WP-API Importer');
							injectDevRoute(params, {
								entrypoint: resolve('routes/wp-api-importer.ts'),
								pattern: WP_API_URL,
							});
							addDevToolbarApp({
								name: 'Wordpress API Importer',
								id: 'wp-api-importer',
								icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2M3.01 12c0-1.3.28-2.54.78-3.66l4.29 11.75c-3-1.46-5.07-4.53-5.07-8.09M12 20.99c-.88 0-1.73-.13-2.54-.37l2.7-7.84l2.76 7.57c.02.04.04.09.06.12c-.93.34-1.93.52-2.98.52m1.24-13.21c.54-.03 1.03-.09 1.03-.09c.48-.06.43-.77-.06-.74c0 0-1.46.11-2.4.11c-.88 0-2.37-.11-2.37-.11c-.48-.02-.54.72-.05.75c0 0 .46.06.94.09l1.4 3.84l-1.97 5.9l-3.27-9.75c.54-.02 1.03-.08 1.03-.08c.48-.06.43-.77-.06-.74c0 0-1.46.11-2.4.11c-.17 0-.37 0-.58-.01C6.1 4.62 8.86 3.01 12 3.01c2.34 0 4.47.89 6.07 2.36c-.04 0-.08-.01-.12-.01c-.88 0-1.51.77-1.51 1.6c0 .74.43 1.37.88 2.11c.34.6.74 1.37.74 2.48c0 .77-.3 1.66-.68 2.91l-.9 3zm6.65-.09a8.99 8.99 0 0 1-3.37 12.08l2.75-7.94c.51-1.28.68-2.31.68-3.22c0-.33-.02-.64-.06-.92"/></svg>`,
								entrypoint: resolve('./apps/wp-importer'),
							});
						}
					}
				},
			},
		};
	},
});
