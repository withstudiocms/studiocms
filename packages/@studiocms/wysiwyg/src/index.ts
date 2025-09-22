/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS plugin in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="studiocms/v/types" />
/// <reference types="astro/client" />

import type { AstroIntegration } from 'astro';
import { createResolver } from 'astro-integration-kit';
import { definePlugin, type StudioCMSPlugin } from 'studiocms/plugins';
import { GRAPES_CSS_PATH, PARTIAL_PATH, STORE_ENDPOINT_PATH } from './consts.js';
import { shared } from './lib/shared.js';
import { WYSIWYGSchema, type WYSIWYGSchemaOptions } from './types.js';

/**
 * Creates an internal Astro integration for WYSIWYG rendering.
 * This is used for testing and internal purposes.
 *
 * @param {string} packageIdentifier - The package identifier for the integration.
 * @param {WYSIWYGSchemaOptions} [options] - Optional configuration options for the WYSIWYG plugin.
 * @returns {AstroIntegration} The configured Astro integration.
 */
export function internalWysiwygIntegration(
	packageIdentifier: string,
	options?: WYSIWYGSchemaOptions
): AstroIntegration {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Validate and parse the provided options using the WYSIWYG schema
	const resolvedOptions = WYSIWYGSchema.parse(options);

	// Helper function to create route entrypoints
	const resEntrypoint = (path: string) => `@studiocms/wysiwyg/routes/${path}`;

	// Define the routes for the plugin
	const routes = [
		{
			entrypoint: resolve('./routes/partial.astro'),
			pattern: PARTIAL_PATH,
			prerender: false,
		},
		{
			entrypoint: resEntrypoint('grapes.css.js'),
			pattern: GRAPES_CSS_PATH,
			prerender: false,
		},
		{
			entrypoint: resEntrypoint('store.js'),
			pattern: STORE_ENDPOINT_PATH,
			prerender: false,
		},
	];

	return {
		name: packageIdentifier,
		hooks: {
			'astro:config:setup': ({ injectRoute }) => {
				// Register the routes for the plugin
				for (const route of routes) {
					injectRoute(route);
				}
			},
			'astro:config:done': () => {
				// Set shared options for the plugin
				shared.sanitize = resolvedOptions?.sanitize;
			},
		},
	};
}

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
function wysiwyg(opts?: WYSIWYGSchemaOptions): StudioCMSPlugin {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Validate and parse the provided options using the WYSIWYG schema
	const options = WYSIWYGSchema.parse(opts);

	// Define the package identifier
	const packageIdentifier = '@studiocms/wysiwyg';

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS WYSIWYG Editor',
		studiocmsMinimumVersion: '0.1.0-beta.23',
		hooks: {
			'studiocms:astro:config': ({ addIntegrations }) => {
				// Add the WYSIWYG editor integration to the Astro configuration
				addIntegrations(internalWysiwygIntegration(packageIdentifier, options));
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
