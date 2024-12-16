import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { createResolver, defineUtility } from 'astro-integration-kit';
import type { StudioCMSFrontEndOptions } from '../schema';

// Define log level
const logLevel = 'info';

// Create resolver relative to this file
const { resolve } = createResolver(import.meta.url);

export const configSetup = defineUtility('astro:config:setup')(
	(
		{ logger, injectRoute },
		{ verbose, dbStartPage, defaultFrontEndConfig }: StudioCMSFrontEndOptions
	) => {
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
	}
);

export default configSetup;
