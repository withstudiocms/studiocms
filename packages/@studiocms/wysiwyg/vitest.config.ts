import type { AstroIntegration } from 'astro';
import { getViteConfig } from 'astro/config';
import { addVirtualImports } from 'astro-integration-kit';
import { defineProject, mergeConfig } from 'vitest/config';
import { configShared } from '../../../vitest.shared.js';
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
		mergeConfig(configShared, {
			test: {
				name: '@studiocms/wysiwyg',
				include: ['**/*.test.ts'],
			},
			define: {
				'import.meta.env.PROD': false,
			},
		}),
		{
			integrations: [testIntegration, internalWysiwygIntegration('@studiocms/wysiwyg')],
		}
	)
);
