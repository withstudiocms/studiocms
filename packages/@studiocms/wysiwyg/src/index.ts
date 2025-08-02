/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS plugin in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="studiocms/v/types" />
/// <reference types="astro/client" />

import { createResolver } from 'astro-integration-kit';
import { definePlugin, type StudioCMSPlugin } from 'studiocms/plugins';
import { GRAPES_CSS_PATH, PARTIAL_PATH } from './common/consts.js';
import { shared } from './common/shared.js';
import type { WYSIWYGSchemaOptions } from './common/types.js';

/**
 * Creates and configures the StudioCMS WYSIWYG Editor plugin.
 *
 * This plugin integrates a WYSIWYG editor into the StudioCMS environment,
 * registering custom routes, rendering components, and handling configuration hooks.
 *
 * @param options - Optional configuration for the WYSIWYG schema, including sanitization options.
 * @returns A configured StudioCMS plugin instance for the WYSIWYG editor.
 *
 * @example
 * ```typescript
 * import wysiwyg from '@studiocms/wysiwyg';
 *
 * plugins: [
 *   wysiwyg({
 *     sanitize: {}
 *   })
 * ]
 * ```
 */
function wysiwyg(options?: WYSIWYGSchemaOptions): StudioCMSPlugin {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Define the package identifier
	const packageIdentifier = '@studiocms/wysiwyg';

	// Define the routes for the plugin
	const routes = [
		{
			entrypoint: resolve('./routes/partial.astro'),
			pattern: PARTIAL_PATH,
		},
		{
			entrypoint: resolve('./routes/grapes.css.js'),
			pattern: GRAPES_CSS_PATH,
		}
	]

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS WYSIWYG Editor',
		studiocmsMinimumVersion: '0.1.0-beta.23',
		hooks: {
			'studiocms:astro:config': ({ addIntegrations }) => {
				// Add the WYSIWYG editor routes to the Astro configuration and
				// set shared options for the plugin.
				addIntegrations({
					name: packageIdentifier,
					hooks: {
						'astro:config:setup': (params) => {
							// Register the routes for the plugin
							for (const route of routes) {
								params.injectRoute({
									...route,
									prerender: false,
								});
							}
						},
						'astro:config:done': () => {
							// Set shared options for the plugin
							shared.sanitize = options?.sanitize || {};
						},
					},
				});
			},
			'studiocms:config:setup': ({ setRendering }) => {
				// Set the rendering configuration for the WYSIWYG editor
				// This will allow the editor to be rendered in the StudioCMS environment
				// and provide the necessary components for the editor.
				setRendering({
					pageTypes: [
						{
							identifier: 'studiocms/wysiwyg',
							label: 'WYSIWYG',
							rendererComponent: resolve('./components/Render.astro'),
							pageContentComponent: resolve('./components/Editor.astro'),
						},
					],
				});
			},
		},
	});
}

export default wysiwyg;
