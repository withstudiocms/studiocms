/// <reference types="./virtual.d.ts" preserve="true" />

import createPathResolver from '@withstudiocms/internal_helpers/pathResolver';
import type { AstroIntegration } from 'astro';
import { markdownConfigDefaults } from '../core/index.ts';
import type { StudioCMSMarkdownRemarkIntegrationOptions } from '../types.ts';
import { defaultIntegrationOptions } from './consts.ts';
import { addVirtualImports } from './integration-utils.ts';
import { shared } from './shared.ts';

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
		components = {},
		markdownExtended = markdownConfigDefaults.studiocms,
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

	const virtualComponents = resolve('./components/virtual.js');

	return {
		name: '@studiocms/markdown-remark',
		hooks: {
			'astro:config:setup': (params) => {
				const { resolve: astroRootResolve } = createPathResolver(params.config.root.pathname);

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
								.map(
									([name, path]) =>
										`export { default as ${name.toLowerCase()} } from '${astroRootResolve(path)}';`
								)
								.join('\n')}
						`,
					},
				});

				// Inject the CSS for the Markdown processor if enabled
				if (injectCSS) {
					params.injectScript('page-ssr', 'import "studiocms:markdown-remark/css";');
				}
			},
			'astro:config:done': ({ config }) => {
				// Store the markdown config and studiocms config in a shared object so that it can be accessed by the virtual components.
				shared.markdownConfig = config.markdown;
				shared.studiocms = markdownExtended;
			},
		},
	};
};

export default markdownRemark;
