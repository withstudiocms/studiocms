import { defineUtility } from 'astro-integration-kit';
import { StudioCMSCoreError } from '../errors.js';
import { integrationLogger } from './integrationLogger.js';

/**
 * Checks the Users Astro Config for the following:
 *
 * - Astro:DB Integration
 * - SSR Mode (output: "server")
 * - Site URL is set (can be "http://localhost:4321" for local development)
 */
export const checkAstroConfig = defineUtility('astro:config:setup')(
	({ config: astroConfig, logger }) => {
		// Check for Astro:DB Integration
		if (!astroConfig.integrations.find(({ name }) => name === 'astro:db')) {
			throw new StudioCMSCoreError(
				'Astro DB Integration not found in Astro Config',
				'Run `astro add db` to install `@astrojs/db` and add it to your Astro config.'
			);
		}

		if (!astroConfig.adapter) {
			throw new StudioCMSCoreError(
				'SSR Adapter not found in Astro Config',
				'StudioCMS requires a Server Adapter to be set in your Astro Config. For instructions on how to setup a Server Adapter, see the Astro Docs: https://docs.astro.build/en/guides/on-demand-rendering/#server-adapters'
			);
		}

		// Check for Site URL
		if (!astroConfig.site) {
			throw new StudioCMSCoreError(
				"StudioCMS requires a 'site' configuration in your Astro Config. This can be your domain ( 'https://example.com' ) or localhost ( 'http://localhost:4321' - localhost should only be used during development and should not be used in production)."
			);
		}

		integrationLogger(
			{ logger, logLevel: 'info', verbose: true },
			'Astro Config `output` & `site` options valid'
		);
	}
);
