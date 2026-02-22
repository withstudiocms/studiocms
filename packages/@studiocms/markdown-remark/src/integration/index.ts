import createPathResolver from '@withstudiocms/internal_helpers/pathResolver';
import type { AstroIntegration } from 'astro';
import { markdownConfigDefaults } from '../core/index.ts';
import type { StudioCMSMarkdownRemarkIntegrationOptions } from '../types.ts';
import { defaultIntegrationOptions } from './consts.ts';

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

	const headingsCSS = resolve('../styles/headings.css');

	const calloutTheme =
		// biome-ignore lint/complexity/useOptionalChain: type of callouts can be false, so we need to check for that before accessing the theme property.
		markdownExtended.callouts && markdownExtended.callouts.theme
			? markdownExtended.callouts.theme
			: 'obsidian';

	const resolvedCalloutTheme = resolve(`../styles/callouts/${calloutTheme}.css`);

	return {
		name: '@studiocms/markdown-remark',
		hooks: {},
	};
};

export default markdownRemark;
