/// <reference types="./virtual.d.ts" preserve="true" />
/// <reference types="studiocms/v/types" />

import { addVirtualImports, createResolver } from 'astro-integration-kit';
import { type StudioCMSPlugin, definePlugin } from 'studiocms/plugins';
import { shared } from './lib/shared.js';
import type { MDXPluginOptions } from './types.js';

export function plugin(options?: MDXPluginOptions): StudioCMSPlugin {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	const packageIdentifier = '@studiocms/mdx';

	const renderer = resolve('./components/MDXRenderer.astro');

	const internalRenderer = resolve('./lib/render.js');

	const resolvedOptions = {
		remarkPlugins: options?.remarkPlugins || [],
		rehypePlugins: options?.rehypePlugins || [],
		recmaPlugins: options?.recmaPlugins || [],
		remarkRehypeOptions: options?.remarkRehypeOptions || {},
	};

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS MDX',
		studiocmsMinimumVersion: '0.1.0-beta.12',
		pageTypes: [
			{
				identifier: packageIdentifier,
				label: 'MDX',
				pageContentComponent: 'studiocms/markdown',
				rendererComponent: renderer,
			},
		],
		integration: {
			name: packageIdentifier,
			hooks: {
				'astro:config:setup': async (params) => {
					addVirtualImports(params, {
						name: packageIdentifier,
						imports: {
							'studiocms:mdx/renderer': `
                                import { renderMDX as _render } from '${internalRenderer}';

                                export const renderMDX = _render;
                                export default renderMDX;
                            `,
						},
					});
				},
				'astro:config:done': () => {
					shared.mdxConfig = resolvedOptions;
				},
			},
		},
	});
}

export default plugin;
