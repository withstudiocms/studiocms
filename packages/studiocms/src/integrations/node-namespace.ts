import { builtinModules as builtins } from 'node:module';
import type { AstroIntegration } from 'astro';
import { addVitePlugin, hasVitePlugin } from 'astro-integration-kit';

/**
 * Creates an Astro integration that injects a Vite plugin to automatically
 * resolve Node.js built-in modules using the `node:` protocol namespace.
 *
 * This integration ensures that imports of Node.js built-ins (e.g., 'fs', 'path')
 * are rewritten to use the `node:` prefix and marked as external, preventing
 * bundling and ensuring correct module resolution in Vite-powered Astro projects.
 *
 * The integration checks if the 'namespace-builtins' Vite plugin is already present
 * before adding it, to avoid duplicate plugins.
 *
 * @returns {AstroIntegration} An Astro integration for handling Node.js built-in modules.
 */
export function nodeNamespaceBuiltinsAstro(): AstroIntegration {
	return {
		name: 'vite-namespace-builtins',
		hooks: {
			'astro:config:setup': (params) => {
				if (!hasVitePlugin(params, { plugin: 'namespace-builtins' })) {
					addVitePlugin(params, {
						plugin: {
							name: 'namespace-builtins',
							enforce: 'pre',
							// biome-ignore lint/suspicious/noExplicitAny: This is a Vite plugin, so we don't have control over the type of `id`
							resolveId(id: any) {
								if (id[0] === '.' || id[0] === '/') return;

								if (builtins.includes(id)) {
									return { id: `node:${id}`, external: true };
								}
								return;
							},
						},
					});
				}
			},
		},
	};
}
