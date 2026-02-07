import { componentRegistryHandler } from '@withstudiocms/component-registry';
import type { AstroIntegration } from 'astro';
import { defineConfig } from 'astro/config';
import { addVirtualImports, createResolver } from 'astro-integration-kit';

const label = 'test-integration';

const { resolve } = createResolver(import.meta.url);

const testIntegration: AstroIntegration = {
	name: label,
	hooks: {
		'astro:config:setup': async (params) => {
			// Setup Component Registry
			await componentRegistryHandler(params, {
				config: {
					name: label,
					verbose: true,
					virtualId: 'test:component-registry',
				},
				componentRegistry: {
					'test-comp': resolve('./src/components/test-comp.astro'),
				},
			});

			addVirtualImports(params, {
				name: label,
				imports: {
					'virtual:test-config': `export const config = ${JSON.stringify({ test: true })};`,
				},
			});
		},
	},
};

// https://astro.build/config
export default defineConfig({
	integrations: [testIntegration],
	output: 'static',
	devToolbar: {
		enabled: false,
	},
});
