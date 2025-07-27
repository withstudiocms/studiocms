/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS plugin in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="./virtual.d.ts" preserve="true" />
/// <reference types="studiocms/v/types" />

import { createResolver } from 'astro-integration-kit';
import { type StudioCMSPlugin, definePlugin } from 'studiocms/plugins';
import { shared } from './lib/shared.js';
import { HTMLSchema, type HTMLSchemaOptions } from './types.js';

/**
 * Creates the StudioCMS HTML plugin.
 *
 * This plugin integrates HTML page type support into StudioCMS, providing editor and renderer components.
 * It resolves configuration options, sets up Astro integrations, and registers the HTML page type for rendering.
 *
 * @param options - Optional configuration for the HTML schema.
 * @returns The StudioCMS plugin configuration object.
 */
export function studiocmsHTML(options?: HTMLSchemaOptions): StudioCMSPlugin {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Define the package identifier
	const packageIdentifier = '@studiocms/html';

	// Resolve the options and set defaults if not provided
	const resolvedOptions = HTMLSchema.safeParse(options).data;

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS HTML',
		studiocmsMinimumVersion: '0.1.0-beta.21',
		hooks: {
			'studiocms:astro:config': ({ addIntegrations }) => {
				addIntegrations({
					name: packageIdentifier,
					hooks: {
						'astro:config:done': () => {
							// Store the resolved options in the shared context for the renderer
							shared.htmlConfig = resolvedOptions;
						},
					},
				});
			},
			'studiocms:config:setup': ({ setRendering }) => {
				setRendering({
					pageTypes: [
						// Define the HTML page type
						{
							identifier: 'studiocms/html',
							label: 'HTML',
							pageContentComponent: resolve('./components/editor.astro'),
							rendererComponent: resolve('./components/renderer.astro'),
						},
					],
				});
			},
		},
	});
}

export default studiocmsHTML;
