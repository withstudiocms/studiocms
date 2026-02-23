/// <reference types="./virtual.d.ts" preserve="true" />

import createPathResolver from '@withstudiocms/internal_helpers/pathResolver';
import type { AstroIntegration } from 'astro';
import { MarkdownRemarkError } from '../errors.ts';
import type { StudioCMSMarkdownRemarkIntegrationOptions } from '../types.ts';
import { defaultIntegrationOptions } from './consts.ts';
import { addVirtualImports } from './integration-utils.ts';
import { setSharedConfig } from './shared.ts';

const isValidJsIdentifier = (name: string) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);

/**
 * Astro Integration for StudioCMS's Markdown Remark processor.
 *
 * This integration sets up the necessary hooks to inject the Markdown processor into the Astro build process, including injecting types, CSS, and user-defined components. It also provides a way for users to configure the Markdown processor through their Astro configuration file, allowing for customization of features like callouts, autolinking, and Discord subtext.
 *
 * @param opts - The configuration options for the Markdown Remark integration, including whether to inject CSS, user-defined components, and extended markdown options specific to StudioCMS.
 * @returns An AstroIntegration object that can be used in the user's Astro configuration file to enable the Markdown Remark processor with the specified options.
 */
const markdownRemark = (
	opts: StudioCMSMarkdownRemarkIntegrationOptions = defaultIntegrationOptions
): AstroIntegration => {
	const {
		injectCSS = defaultIntegrationOptions.injectCSS,
		components = defaultIntegrationOptions.components,
		markdownExtended = defaultIntegrationOptions.markdownExtended,
		verbose = defaultIntegrationOptions.verbose,
	} = opts;

	const { resolve } = createPathResolver(import.meta.url);

	// We resolve the headings CSS path here so that it can be imported in the virtual CSS module.
	const headingsCSS = resolve('../styles/headings.css');

	// We store the markdown config and studiocms config in a shared object so that it can be accessed by the virtual components.
	const calloutTheme =
		// biome-ignore lint/complexity/useOptionalChain: type of callouts can be false, so we need to check for that before accessing the theme property.
		markdownExtended.callouts && markdownExtended.callouts.theme
			? markdownExtended.callouts.theme
			: 'obsidian';

	// We resolve the callout theme path here so that we can conditionally import it in the virtual CSS module.
	const resolvedCalloutTheme = resolve(`../styles/callouts/${calloutTheme}.css`);

	// We resolve the virtual components path here so that it can be imported in the virtual module for the components. This allows us to keep the virtual module clean and focused on just exporting the components, while still allowing us to use the resolved path for the virtual imports.
	const virtualComponents = resolve('./components/virtual.js');

	// Message array for storing log messages
	const messages: string[] = [];

	return {
		name: '@studiocms/markdown-remark',
		hooks: {
			'astro:config:setup': (params) => {
				const { resolve: astroRootResolve } = createPathResolver(params.config.root.pathname);

				// Extract Logger from params for use in this hook
				const logger = params.logger;

				// Log the initial configuration options for the integration.
				logger.info('Setting up Markdown Remark integration...');

				// Add virtual imports for the Markdown Remark processor
				addVirtualImports(params, {
					name: '@studiocms/markdown-remark',
					imports: {
						'studiocms:markdown-remark': `export * from '${virtualComponents}';`,
						'studiocms:markdown-remark/css': `import '${headingsCSS}'; ${
							markdownExtended.callouts ? `import '${resolvedCalloutTheme}';` : ''
						}`,
						'studiocms:markdown-remark/user-components': `
							export const componentKeys = ${JSON.stringify(Object.keys(components).map((name) => name.toLowerCase()))};

							${Object.entries(components)
								.map(([name, path]) => {
									const id = name.toLowerCase();
									if (!isValidJsIdentifier(id)) {
										throw new MarkdownRemarkError(
											`Invalid component name "${name}": must be a valid JavaScript identifier when lowercased.`
										);
									}
									return `export { default as ${id} } from '${astroRootResolve(path)}';`;
								})
								.join('\n')}
						`,
					},
				});

				// Log the user-defined components length if verbose mode is enabled.
				if (verbose) {
					messages.push(`User defined components: ${Object.keys(components).length}`);
				}

				// Inject the CSS for the Markdown processor if enabled
				if (injectCSS) {
					params.injectScript('page-ssr', 'import "studiocms:markdown-remark/css";');
					if (verbose) {
						messages.push('CSS injection is enabled.');
					}
				}

				// Log the collected messages if verbose mode is enabled.
				if (verbose) {
					messages.forEach((message) => logger.info(message));
				}
			},
			'astro:config:done': ({ config, logger }) => {
				// Log the final configuration for the integration if verbose mode is enabled. This includes the injectCSS option, the user-defined components, and the extended markdown options specific to StudioCMS.
				if (verbose) {
					logger.info('Final Markdown Remark configuration:');
					logger.info(`Inject CSS: ${injectCSS}`);
					logger.info(
						`Components: ${Object.keys(components).length > 0 ? Object.keys(components).join(', ') : 'None'}`
					);
					logger.info(`Markdown Extended options: ${JSON.stringify(markdownExtended)}`);
				}

				// Store the markdown config and studiocms config in a shared object so that it can be accessed by the virtual components.
				setSharedConfig({
					markdownConfig: config.markdown,
					studiocms: markdownExtended,
				});

				// Log that the integration has been successfully set up.
				logger.info('Markdown Remark integration successfully set up!');
			},
		},
	};
};

export default markdownRemark;
