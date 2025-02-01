import type { AstroIntegration } from 'astro';
import { createResolver } from 'astro-integration-kit';
import type { StudioCMSFrontEndOptions } from './schema.js';
import { integrationLogger } from './utils/integrationLogger.js';
import readJson from './utils/readJson.js';

const { name } = readJson<{ name: string }>(new URL('../package.json', import.meta.url));

/**
 * StudioCMS Frontend Integration
 */
function studioCMSFrontend({
	verbose,
	dbStartPage,
	defaultFrontEndConfig,
}: StudioCMSFrontEndOptions): AstroIntegration {
	// Define log level
	const logLevel = 'info';

	// Create resolver relative to this file
	const { resolve } = createResolver(import.meta.url);
	return {
		name,
		hooks: {
			'astro:config:setup': ({ logger, injectRoute }) => {
				// Log Setup
				integrationLogger({ logger, logLevel, verbose }, 'Setting up Frontend...');

				// Check if Database Start Page is enabled
				let shouldInject = false;

				if (typeof defaultFrontEndConfig === 'boolean') {
					shouldInject = defaultFrontEndConfig;
				} else if (typeof defaultFrontEndConfig === 'object') {
					shouldInject = defaultFrontEndConfig.injectDefaultFrontEndRoutes;
				}

				switch (dbStartPage) {
					case true:
						integrationLogger(
							{ logger, logLevel, verbose },
							'Database Start Page enabled, skipping Default Frontend Routes Injection... Please follow the Database Setup Guide to create your Frontend.'
						);
						break;
					case false:
						integrationLogger(
							{ logger, logLevel, verbose },
							'Database Start Page disabled, checking for Default Frontend Routes Injection...'
						);

						if (shouldInject) {
							integrationLogger(
								{ logger, logLevel, verbose },
								'Route Injection enabled, Injecting Default Frontend Routes...'
							);

							injectRoute({
								pattern: '/',
								entrypoint: resolve('../routes/index.astro'),
								prerender: false,
							});

							injectRoute({
								pattern: '[...slug]',
								entrypoint: resolve('../routes/[...slug].astro'),
								prerender: false,
							});

							integrationLogger({ logger, logLevel, verbose }, 'Frontend Routes Injected!');
						}
						break;
				}
			},
		},
	};
}

export default studioCMSFrontend;
