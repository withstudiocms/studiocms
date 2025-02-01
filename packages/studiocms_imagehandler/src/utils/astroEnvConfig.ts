import type { AstroConfig } from 'astro';
import { defineUtility } from 'astro-integration-kit';

/**
 * Add Astro Environment Variables Config for using 'astro:env'
 */
export const addAstroEnvConfig = defineUtility('astro:config:setup')(
	(params, env: AstroConfig['env']) => {
		// Update Astro Config with Environment Variables (`astro:env`)
		params.updateConfig({ env });
	}
);
