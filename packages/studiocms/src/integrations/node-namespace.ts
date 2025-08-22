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
							resolveId(id: string) {
								if (!id || id[0] === '.' || id[0] === '/') return;
								// Support already-namespaced ids and builtin subpaths (e.g., 'fs/promises').
								const plain = id.startsWith('node:') ? id.slice(5) : id;
								if (builtins.includes(plain)) {
									const namespaced = id.startsWith('node:') ? id : `node:${id}`;
									return { id: namespaced, external: true };
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
