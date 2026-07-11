/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS plugin in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="./virtual.d.ts" preserve="true" />
/// <reference types="studiocms/v/types" />

import { Schema } from 'effect';
import { definePlugin } from 'studiocms/plugins';
import type { StudioCMSPluginDef } from 'studiocms/schemas';
import { shared } from './lib/shared.js';
import { HTMLSchema, type HTMLSchemaOptions } from './types.js';

function resolve(path: string) {
	return new URL(path, import.meta.url).toString();
}

/**
 * Creates the StudioCMS HTML plugin.
 *
 * This plugin integrates HTML page type support into StudioCMS, providing editor and renderer components.
 * It resolves configuration options, sets up Astro integrations, and registers the HTML page type for rendering.
 *
 * @param options - Optional configuration for the HTML schema.
 * @returns The StudioCMS plugin configuration object.
 */
export function studiocmsHTML(options: HTMLSchemaOptions = {}): StudioCMSPluginDef {
	// Define the package identifier
	const packageIdentifier = '@studiocms/html';

	// Resolve the options and set defaults if not provided
	const parseResult = Schema.decodeEither(HTMLSchema)(options);
	if (parseResult._tag === 'Left') {
		throw new Error(`Invalid HTML options: ${parseResult.left.message}`);
	}
	const resolvedOptions = parseResult.right;

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS HTML',
		hooks: {
			'studiocms:astro-config': async ({ addIntegrations }) => {
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
			'studiocms:rendering': async ({ setRendering }) => {
				setRendering({
					pageTypes: [
						// Define the HTML page type
						{
							identifier: 'studiocms/html',
							label: 'HTML',
							pageContentComponent: resolve('./components/editor.astro'),
							rendererComponent: resolve('./components/render.js'),
						},
					],
				});
			},
		},
	});
}

export default studiocmsHTML;
