/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS plugin in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="studiocms/v/types" />
/// <reference types="astro/client" />

import { createResolver } from 'astro-integration-kit';
import { definePlugin, type StudioCMSPlugin } from 'studiocms/plugins';
import { shared } from './common/shared.js';
import type { WYSIWYGSchemaOptions } from './common/types.js';

/**
 * StudioCMS WYSIWYG Editor
 */
function studiocmsWYSIWYG(options?: WYSIWYGSchemaOptions): StudioCMSPlugin {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Define the package identifier
	const packageIdentifier = '@studiocms/wysiwyg';

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS WYSIWYG Editor',
		studiocmsMinimumVersion: '0.1.0-beta.23',
		hooks: {
			'studiocms:astro:config': ({ addIntegrations }) => {
				addIntegrations({
					name: packageIdentifier,
					hooks: {
						'astro:config:setup': (params) => {
							params.injectRoute({
								entrypoint: resolve('./routes/partial.astro'),
								pattern: '/studiocms_api/wysiwyg_editor/partial',
								prerender: false,
							});
							params.injectRoute({
								entrypoint: resolve('./routes/grapes.css.js'),
								pattern: '/studiocms_api/wysiwyg_editor/grapes.css',
								prerender: true,
							});
						},
						'astro:config:done': () => {
							shared.sanitize = options?.sanitize || {};
						},
					},
				});
			},
			'studiocms:config:setup': ({ setRendering }) => {
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

export default studiocmsWYSIWYG;
