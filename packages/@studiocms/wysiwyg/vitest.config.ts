import type { AstroIntegration } from 'astro';
import { getViteConfig } from 'astro/config';
import { addVirtualImports } from 'astro-integration-kit';
import { defineProject } from 'vitest/config';
import { internalWysiwygIntegration } from './src/index.js';

const testIntegration: AstroIntegration = {
	name: 'test-integration',
	hooks: {
		'astro:config:setup': (params) => {
			addVirtualImports(params, {
				name: 'test-integration',
				imports: {
					'studiocms:component-registry/runtime':
						// Test-only identity renderer: mirrors API shape but skips sanitization on purpose.
						'export const createRenderer = (result, sanitize, preRenderer) => (content) => content;',
				},
			});
		},
	},
};

export default defineProject(
	getViteConfig(
		{
			test: {
				name: '@studiocms/wysiwyg',
				environment: 'node',
				include: ['**/*.test.ts', '**/*.test.tsx'],
			},
			define: {
				'import.meta.env.PROD': false,
			},
		},
		{
			integrations: [testIntegration, internalWysiwygIntegration('@studiocms/wysiwyg')],
		}
	)
);
