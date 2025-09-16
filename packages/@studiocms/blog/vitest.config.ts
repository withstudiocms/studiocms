import { internalMarkdownIntegration } from '@studiocms/md';
import type { AstroIntegration } from 'astro';
import { getViteConfig } from 'astro/config';
import { addVirtualImports } from 'astro-integration-kit';
import { defineProject } from 'vitest/config';
import { internalBlogIntegration } from './src/index.js';

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
					'studiocms:version': `export default '0.0.0-test';`,
					'studiocms:lib': `
						export const pathWithBase = (path) => path;
						export * from 'studiocms/lib/head';
						export * from 'studiocms/lib/headDefaults';
					`,
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
			integrations: [testIntegration, internalMarkdownIntegration(), internalBlogIntegration()],
		}
	)
);
