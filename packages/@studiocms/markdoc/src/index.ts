/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS plugin in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="./virtual.d.ts" preserve="true" />
/// <reference types="studiocms/v/types" />

import { addVirtualImports, createResolver } from 'astro-integration-kit';
import { definePlugin, type StudioCMSPlugin } from 'studiocms/plugins';
import { shared } from './lib/shared.js';
import type { MarkDocPluginOptions } from './types.js';

export function studiocmsMarkDoc(options?: MarkDocPluginOptions): StudioCMSPlugin {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Define the package identifier
	const packageIdentifier = '@studiocms/markdoc';

	// Resolve the path to the MDX renderer component
	const renderer = resolve('./components/MarkDocRenderer.astro');

	const editor = resolve('./components/editor.astro');

	// Resolve the path to the internal renderer
	const internalRenderer = resolve('./lib/render.js');

	// Resolve the options and set defaults if not provided
	const resolvedOptions: MarkDocPluginOptions = {
		type: options?.type || 'html',
		argParse: options?.argParse,
		transformConfig: options?.transformConfig,
	};

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS MarkDoc',
		studiocmsMinimumVersion: '0.1.0-beta.21',
		requires: ['@studiocms/md'],
		hooks: {
			'studiocms:astro:config': ({ addIntegrations }) => {
				addIntegrations({
					name: packageIdentifier,
					hooks: {
						'astro:config:setup': (params) => {
							// Add the virtual imports for the MarkDoc renderer
							addVirtualImports(params, {
								name: packageIdentifier,
								imports: {
									'studiocms:markdoc/renderer': `
										import { renderMarkDoc as _render } from '${internalRenderer}';
										export const renderMarkDoc = _render;
										export default renderMarkDoc;
									`,
								},
							});
						},
						'astro:config:done': () => {
							// Store the resolved options in the shared context for the renderer
							shared.markDocConfig = resolvedOptions;
						},
					},
				});
			},
			'studiocms:config:setup': ({ setRendering }) => {
				setRendering({
					pageTypes: [
						// Define the MarkDoc page type
						{
							identifier: 'studiocms/markdoc',
							label: 'MarkDoc',
							pageContentComponent: editor,
							rendererComponent: renderer,
						},
					],
				});
			},
		},
	});
}

export default studiocmsMarkDoc;
