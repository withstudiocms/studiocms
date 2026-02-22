import type { AstroConfig, AstroUserConfig, RemotePattern } from 'astro';
import type { HTMLString } from 'astro/runtime/server/index.js';
import type * as hast from 'hast';
import type * as unified from 'unified';

// biome-ignore lint/suspicious/noExplicitAny: Dynamic Rehype plugin types
export type RehypePlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	hast.Root
>;

/**
 * A utility type that excludes `undefined` from a given type `T`. This is useful for ensuring that certain properties are always defined, even if they were optional in the original type.
 *
 * @template T - The type from which to exclude `undefined`.
 * @returns A new type that is the same as `T` but without `undefined`.
 */
type NoUndefined<T> = T extends undefined ? never : T;

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
 * The configuration options for the Astro Markdown processor. This type is derived from the `markdown` property of the `AstroConfig` type, which represents the user's configuration for markdown processing in an Astro project.
 *
 * @see AstroConfig
 */
export type AstroMarkdownConfig = AstroConfig['markdown'];

/**
 * The Astro Markdown configuration options that a user can specify in their Astro configuration file. This type is derived from the `markdown` property of the `AstroUserConfig` type, which represents the user's configuration for an Astro project before it is processed and normalized by Astro.
 *
 * @see AstroUserConfig
 */
export type AstroUserMarkdownConfig = NoUndefined<AstroUserConfig['markdown']>;

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
export interface StudioCMSMarkdownOptions extends AstroUserMarkdownConfig {
	studiocms?: StudioCMSMarkdownExtendedOptions;
}

/**
 * The type for the default options of the markdown processor. This type is derived from the `StudioCMSMarkdownOptions` type, but with all properties required and no `undefined` values allowed. This ensures that the default configuration for the markdown processor is fully defined and does not contain any optional properties.
 */
export type StudioCMSMarkdownConfig = RecursiveRequired<StudioCMSMarkdownOptions>;

/**
 * The type for the options that can be passed to the markdown processor when rendering markdown content. This includes an optional `fileURL` property, which can be used to provide the URL of the file being processed, and a `frontmatter` property, which can be used to pass frontmatter data to plugins that need it.
 */
export interface StudioCMSMarkdownProcessorOptions extends StudioCMSMarkdownOptions {
	image?: {
		domains?: string[];
		remotePatterns?: RemotePattern[];
	};
	experimentalHeadingIdCompat?: boolean;
}

/**
 * The Implementation definition for the markdown processor, which includes a `render` method that takes markdown content as a string and optional rendering options, and returns a promise that resolves to a `MarkdownProcessorRenderResult`. This result includes the rendered HTML code, an `astroHTML` property that is an instance of `HTMLString`, and metadata about the rendered content such as headings and image paths.
 */
export interface MarkdownProcessor {
	render: (
		content: string,
		opts?: MarkdownProcessorRenderOptions
	) => Promise<MarkdownProcessorRenderResult>;
}

/**
 * The options that can be passed to the `render` method of the markdown processor. This includes an optional `fileURL` property, which can be used to provide the URL of the file being processed, and a `frontmatter` property, which can be used to pass frontmatter data to plugins that need it. The `frontmatter` property is a record with string keys and values of any type, as the shape of frontmatter can vary greatly depending on the user's content.
 *
 * @remarks
 * The `fileURL` property is marked as internal because it is intended for use by plugins that need to know the URL of the file being processed, and is not meant to be used by end-users directly. The `frontmatter` property is included here to allow for flexibility in how frontmatter data is passed to plugins, as different plugins may require different shapes of frontmatter data.
 */
export interface MarkdownProcessorRenderOptions {
	/** @internal */
	fileURL?: URL;
	/** Used for frontmatter injection plugins */
	// biome-ignore lint/suspicious/noExplicitAny: Type of frontmatter can vary greatly depending on the user's content, so we allow any shape here.
	frontmatter?: Record<string, any>;
}

/**
 * The result of rendering markdown content with the markdown processor. This includes the rendered HTML code as a string, an `astroHTML` property that is an instance of `HTMLString`, and metadata about the rendered content such as headings, local image paths, remote image paths, and frontmatter data. The `frontmatter` property in the metadata is a record with string keys and values of any type, as the shape of frontmatter can vary greatly depending on the user's content.
 *
 * @remarks
 * The `code` property contains the rendered HTML as a string, while the `astroHTML` property is an instance of `HTMLString`, which can be used in Astro components to safely render HTML content. The `metadata` property provides additional information about the rendered content, such as the headings that were found in the markdown, the paths of any local or remote images, and the frontmatter data that was passed in or extracted from the markdown.
 */
export interface MarkdownProcessorRenderResult {
	code: string;
	astroHTML: HTMLString;
	metadata: {
		headings: MarkdownHeading[];
		localImagePaths: string[];
		remoteImagePaths: string[];
		// biome-ignore lint/suspicious/noExplicitAny: Type of frontmatter can vary greatly depending on the user's content, so we allow any shape here.
		frontmatter: Record<string, any>;
	};
}

/**
 * Represents a heading found in the markdown content. This includes the depth of the heading (e.g., 1 for H1, 2 for H2, etc.), a slug that can be used for linking to the heading, and the text content of the heading.
 */
export interface MarkdownHeading {
	depth: number;
	slug: string;
	text: string;
}

/**
 * The configuration options for the StudioCMS Markdown Remark integration. This includes options for injecting CSS, defining custom components, and extended markdown options specific to StudioCMS. This type is intended to be used when configuring the integration in the user's Astro configuration file.
 */
export interface StudioCMSMarkdownRemarkIntegrationOptions {
	injectCSS?: boolean;
	components?: Record<string, string>;
	markdownExtended?: StudioCMSMarkdownExtendedOptions;
}
