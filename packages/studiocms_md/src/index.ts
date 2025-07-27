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
import { MarkdownSchema, type MarkdownSchemaOptions } from './types.js';

/**
 * Creates a StudioCMS plugin for Markdown page types.
 *
 * This plugin configures StudioCMS to support Markdown content, including rendering and editing components,
 * integration with Astro, and optional callout themes. It resolves user-provided options, sets up virtual imports,
 * and injects necessary styles and scripts for Markdown rendering.
 *
 * @param options - Optional configuration for Markdown schema and rendering behavior.
 * @returns A StudioCMSPlugin instance configured for Markdown support.
 *
 * @remarks
 * - Supports custom callout themes if enabled in options.
 * - Integrates with Astro via virtual imports and injected scripts.
 * - Stores resolved options and Astro markdown configuration in shared context.
 *
 * @example
 * ```typescript
 * import { studiocmsMD } from '@studiocms/md';
 * const plugin = studiocmsMD({ flavor: 'studiocms', callouts: 'obsidian' });
 * ```
 */
export function studiocmsMD(options?: MarkdownSchemaOptions): StudioCMSPlugin {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Define the package identifier
	const packageIdentifier = '@studiocms/md';

	/**
	 * Defines the configuration for the Markdown page type in StudioCMS.
	 *
	 * @property identifier - A unique string identifying the Markdown page type.
	 * @property label - The display label for the Markdown page type.
	 * @property rendererComponent - Path to the Astro component responsible for rendering Markdown content.
	 * @property pageContentComponent - Path to the Astro component used for editing Markdown content.
	 */
	const markdownPageType = {
		identifier: 'studiocms/markdown',
		label: 'Markdown',
		rendererComponent: resolve('./components/markdown-render.astro'),
		pageContentComponent: resolve('./components/markdown-editor.astro'),
	};

	// Resolve the path to the internal renderer
	const internalRenderer = resolve('./lib/markdown-prerender.js');

	// Resolve the options and set defaults if not provided
	const resolvedOptions = MarkdownSchema.safeParse(options).data;

	// Define the resolved Callout Theme
	let resolvedCalloutTheme: string | undefined;

	// Resolve the callout theme based on the user's configuration
	if (resolvedOptions?.flavor === 'studiocms' && resolvedOptions.callouts !== false) {
		resolvedCalloutTheme = resolve(
			`./styles/md-remark-callouts/${resolvedOptions.callouts || 'obsidian'}.css`
		);
	} else {
		resolvedCalloutTheme = undefined;
	}

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS Markdown',
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
									'studiocms:md/config': `
										export const config = ${JSON.stringify(resolvedOptions)};
										export default config;
									`,
									'studiocms:md/pre-render': `
										export { preRender } from '${internalRenderer}';
									`,
									'studiocms:md/styles': `
										import '${resolve('./styles/md-remark-headings.css')}';
										${resolvedCalloutTheme ? `import '${resolvedCalloutTheme}';` : ''}
									`,
								},
							});

							if (resolvedOptions?.flavor === 'studiocms') {
								// Inject the StudioCMS-specific styles for the markdown renderer
								params.injectScript('page-ssr', `import "studiocms:md/styles";`);
							}
						},
						'astro:config:done': ({ config }) => {
							// Store the resolved options in the shared context for the renderer
							shared.mdConfig = resolvedOptions;
							shared.astroMDRemark = config.markdown;
						},
					},
				});
			},
			'studiocms:config:setup': ({ setRendering }) => {
				setRendering({
					pageTypes: [markdownPageType],
				});
			},
		},
	});
}

export default studiocmsMD;
