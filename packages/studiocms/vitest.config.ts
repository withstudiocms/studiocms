import type { AstroIntegration } from 'astro';
import { getViteConfig } from 'astro/config';
import { addVirtualImports } from 'astro-integration-kit';
import { defineProject } from 'vitest/config';
import { availableTranslationFileKeys, availableTranslations } from './src/virtuals/i18n/v-files';

const testIntegration: AstroIntegration = {
	name: 'test-integration',
	hooks: {
		'astro:config:setup': (params) => {
			addVirtualImports(params, {
				name: 'test-integration',
				imports: {
					'studiocms:version': `export default '0.0.0-test';`,
					'studiocms:i18n/virtual': `
						export const availableTranslationFileKeys = ${JSON.stringify(availableTranslationFileKeys)};
						export const availableTranslations = ${JSON.stringify(availableTranslations)};
					`,
					'studiocms:config':
						'export const dashboardConfig = { dashboardRouteOverride: undefined };',
				},
			});
		},
	},
};

export default defineProject(
	getViteConfig(
		{
			test: {
				environment: 'node',
				include: ['**/*.test.ts'],
			},
		},
		{
			integrations: [testIntegration],
		}
	)
);
