import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import type { AstroIntegration } from 'astro';
import { createResolver } from 'astro-integration-kit';
import { name } from '../package.json';
import type { StudioCMSFrontEndOptions } from './schema';

/**
 * StudioCMS Frontend Integration
 */
function studioCMSFrontend(opts: StudioCMSFrontEndOptions): AstroIntegration {
	// Create resolver relative to this file
	const { resolve } = createResolver(import.meta.url);

	// Destructure Options
	const { verbose, dbStartPage, defaultFrontEndConfig } = opts;
	const logLevel = 'info';

	let shouldInject = false;

	if (typeof defaultFrontEndConfig === 'boolean') {
		shouldInject = defaultFrontEndConfig;
	} else if (typeof defaultFrontEndConfig === 'object') {
		shouldInject = defaultFrontEndConfig.injectDefaultFrontEndRoutes;
	}

	return {
		name,
		hooks: {
			'astro:config:setup': ({ injectRoute, logger }) => {
				integrationLogger({ logger, logLevel, verbose }, 'Setting up Frontend...');

				if (dbStartPage) {
					integrationLogger(
						{ logger, logLevel, verbose },
						'Database Start Page enabled, skipping Default Frontend Routes Injection... Please follow the Database Setup Guide to create your Frontend.'
					);
				} else {
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
							entrypoint: resolve('./routes/index.astro'),
							prerender: false,
						});

						injectRoute({
							pattern: '[...slug]',
							entrypoint: resolve('./routes/[...slug].astro'),
							prerender: false,
						});

						integrationLogger({ logger, logLevel, verbose }, 'Frontend Routes Injected!');
					}
				}
			},
		},
	};
}

export default studioCMSFrontend;
