import type {
	RehypePlugins,
	RemarkPlugins,
	RemarkRehype,
	Smartypants,
} from '@astrojs/internal-helpers/markdown';

/**
 * A utility type that recursively makes all properties of a given type `T` required. This is useful for ensuring that all nested properties of a configuration object are defined, even if they were optional in the original type.
 *
 * @template T - The type to make recursively required.
 * @returns A new type that is the same as `T` but with all properties required.
 */
type RecursiveRequired<T> = {
	[K in keyof T]-?: T[K] extends object ? RecursiveRequired<T[K]> : T[K];
};

/**
 * The StudioCMS Markdown Callout options, which allow users to configure the appearance of callouts in their markdown content. This includes options for selecting a theme for the callouts, such as 'github', 'obsidian', or 'vitepress'.
 */
export interface StudioCMSCalloutOptions {
	theme?: 'github' | 'obsidian' | 'vitepress';
}

/**
 * The extended configuration options for the StudioCMS Markdown processor. This includes additional options specific to StudioCMS, such as callout configuration, autolinking, and Discord subtext. This type is intended to be used in conjunction with the base Astro Markdown options to provide a comprehensive configuration for the markdown processor.
 */
export interface StudioCMSMarkdownExtendedOptions {
	callouts?: StudioCMSCalloutOptions | false;
	autolink?: boolean;
	discordSubtext?: boolean;
}

/**
 * StudioCMS Markdown configuration options that can be specified in the user's Astro configuration file. This extends the base Astro Markdown options with additional options specific to StudioCMS, such as callout configuration, autolinking, and Discord subtext.
 */
export interface StudioCMSMarkdownOptions {
	remarkPlugins?: RemarkPlugins;
	rehypePlugins?: RehypePlugins;
	remarkRehype?: RemarkRehype;
	gfm?: boolean;
	smartypants?: boolean | Smartypants;
	studiocms?: StudioCMSMarkdownExtendedOptions;
}

/**
 * The type for the default options of the markdown processor. This type is derived from the `StudioCMSMarkdownOptions` type, but with all properties required and no `undefined` values allowed. This ensures that the default configuration for the markdown processor is fully defined and does not contain any optional properties.
 */
export type StudioCMSMarkdownConfig = RecursiveRequired<StudioCMSMarkdownOptions>;

/**
 * The configuration options for the StudioCMS Markdown Remark integration. This includes options for injecting CSS, defining custom components, and extended markdown options specific to StudioCMS. This type is intended to be used when configuring the integration in the user's Astro configuration file.
 */
export interface StudioCMSMarkdownRemarkIntegrationOptions {
	injectCSS?: boolean;
	components?: Record<string, string>;
	markdownConfig?: StudioCMSMarkdownOptions;
	verbose?: boolean;
}

/**
 * The complete configuration for the StudioCMS Markdown Remark integration, with all properties required. This type is derived from the `StudioCMSMarkdownRemarkIntegrationOptions` type, but with all properties required and no `undefined` values allowed. This ensures that the configuration for the integration is fully defined and does not contain any optional properties.
 */
export type StudioCMSMarkdownRemarkIntegrationConfig =
	Required<StudioCMSMarkdownRemarkIntegrationOptions>;
