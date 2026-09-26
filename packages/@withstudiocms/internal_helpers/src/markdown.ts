import type { HTMLString } from 'astro/runtime/server/index.js';

/**
 * The options that can be passed to the `render` method of the markdown processor. This includes an optional `fileURL` property, which can be used to provide the URL of the file being processed, and a `frontmatter` property, which can be used to pass frontmatter data to plugins that need it. The `frontmatter` property is a record with string keys and values of any type, as the shape of frontmatter can vary greatly depending on the user's content.
 *
 * @remarks
 * The `fileURL` property is marked as internal because it is intended for use by plugins that need to know the URL of the file being processed, and is not meant to be used by end-users directly. The `frontmatter` property is included here to allow for flexibility in how frontmatter data is passed to plugins, as different plugins may require different shapes of frontmatter data.
 */
export interface MarkdownProcessorRenderOptions {
	/**
	 * Internal property used to provide the URL of the file being processed. This is intended for use by plugins that need to know the URL of the file, and is not meant to be used by end-users directly.
	 */
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
