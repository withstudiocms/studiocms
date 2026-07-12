import { internalMarkdownIntegration } from '@studiocms/md';
import type { AstroIntegration } from 'astro';
import { getViteConfig } from 'astro/config';
import { defineProject, mergeConfig } from 'vitest/config';
import { configShared } from '../../../vitest.shared.js';
import { internalBlogIntegration } from './src/index.js';

function resolve(path: string) {
	return new URL(path, import.meta.url).toString();
}

function virtualImportsPlugin(name: string, imports: Record<string, string>) {
	return {
		name,
		resolveId(id: string) {
			if (id in imports) return `\0${id}`;
		},
		load(id: string) {
			if (id.startsWith('\0')) return imports[id.slice(1)];
		},
	};
}

const testIntegration: AstroIntegration = {
	name: 'test-integration',
	hooks: {
		'astro:config:setup': (params) => {
			params.updateConfig({
				vite: {
					plugins: [
						virtualImportsPlugin('test-integration', {
							'studiocms:component-registry/runtime':
								// Test-only identity renderer: mirrors API shape but skips sanitization on purpose.
								'export const createRenderer = (result, sanitize, preRenderer) => (content) => content;',
							'studiocms:version': `export default '0.0.0-test';`,
							'studiocms:lib': `
								export const pathWithBase = (path) => path;
								export * from 'studiocms/lib/head';
								export * from 'studiocms/lib/headDefaults';
							`,
							'studiocms:config': `
								export const dashboardConfig = { dashboardRouteOverride: undefined };
							`,
							'studiocms:plugin-helpers': `
								export function frontendNavigation(basePkg) {
									return [{ text: 'Home', href: '/', }, { text: 'Blog', href: '/blog' }];
								}
							`,
							'studiocms:components': `export { default as FormattedDate } from '${resolve('./test/fixtures/FormattedDate.astro')}';`,
							'studiocms:imageHandler/components': `export { default as CustomImage } from '${resolve('./test/fixtures/CustomImage.astro')}';`,
						}),
					],
				},
			});
		},
	},
};

export default defineProject(
	getViteConfig(
		mergeConfig(configShared, {
			test: {
				name: '@studiocms/blog',
				include: ['**/*.test.ts'],
			},
		}),
		{
			image: {
				remotePatterns: [
					{
						protocol: 'https',
					},
					{
						protocol: 'http',
					},
				],
			},
			integrations: [testIntegration, internalMarkdownIntegration(), internalBlogIntegration()],
		}
	)
);
