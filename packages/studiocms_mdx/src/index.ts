/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS plugin in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="./virtual.d.ts" preserve="true" />
/// <reference types="studiocms/v/types" />

import { addVirtualImports, createResolver } from 'astro-integration-kit';
import { type StudioCMSPlugin, definePlugin } from 'studiocms/plugins';
import { shared } from './lib/shared.js';
import type { MDXPluginOptions } from './types.js';

/**
 * Creates and configures the StudioCMS MDX plugin.
 *
 * @param {MDXPluginOptions} [options] - Optional configuration options for the MDX plugin.
 * @returns {StudioCMSPlugin} The configured StudioCMS plugin.
 *
 * @example
 * ```typescript
 * plugins: [
 *   studiocmsMDX({
 *     remarkPlugins: [],
 *     rehypePlugins: [],
 *     recmaPlugins: [],
 *     remarkRehypeOptions: {}
 *   }),
 * ]
 * ```
 */
export function studiocmsMDX(options?: MDXPluginOptions): StudioCMSPlugin {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Define the package identifier
	const packageIdentifier = '@studiocms/mdx';

	// Resolve the path to the MDX renderer component
	const renderer = resolve('./components/MDXRenderer.astro');

	const editor = resolve('./components/editor.astro');

	// Resolve the path to the internal renderer
	const internalRenderer = resolve('./lib/render.js');

	// Resolve the options and set defaults if not provided
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
		studiocmsMinimumVersion: '0.1.0-beta.21',
		hooks: {
			'studiocms:astro:config': ({ addIntegrations }) => {
				addIntegrations({
					name: packageIdentifier,
					hooks: {
						'astro:config:setup': (params) => {
							// Add the virtual imports for the MDX renderer
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
							// Store the resolved options in the shared context for the renderer
							shared.mdxConfig = resolvedOptions;
						},
					},
				});
			},
			'studiocms:config:setup': ({ setRendering }) => {
				setRendering({
					pageTypes: [
						// Define the MDX page type
						{
							identifier: 'studiocms/mdx',
							label: 'MDX',
							pageContentComponent: editor,
							rendererComponent: renderer,
						},
					],
				});
			},
		},
	});
}

export default studiocmsMDX;
