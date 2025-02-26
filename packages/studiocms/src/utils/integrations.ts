import { builtinModules as builtins } from 'node:module';
import type { AstroIntegration } from 'astro';
import { addVitePlugin, hasVitePlugin } from 'astro-integration-kit';
import type { PluginOption } from 'vite';

export function namespaceBuiltinsPlugin(): PluginOption {
	return {
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
	};
}
export function nodeNamespaceBuiltinsAstro(): AstroIntegration {
	return {
		name: 'vite-namespace-builtins',
		hooks: {
			'astro:config:setup': (params) => {
				if (!hasVitePlugin(params, { plugin: 'namespace-builtins' })) {
					addVitePlugin(params, { plugin: namespaceBuiltinsPlugin() });
				}
			},
		},
	};
}
