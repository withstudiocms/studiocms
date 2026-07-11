import type { AstroIntegration } from 'astro';
import { getViteConfig } from 'astro/config';
import { defineProject, mergeConfig } from 'vitest/config';
import { configShared } from '../../../vitest.shared.js';

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
				name: '@studiocms/html',
				include: ['**/*.test.ts'],
			},
		}),
		{
			integrations: [testIntegration],
		}
	)
);
