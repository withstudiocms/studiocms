import { HTMLString } from 'astro/runtime/server/escape.js';
import type {
	MarkdownProcessor,
	MarkdownProcessorRenderResult,
	StudioCMSMarkdownConfig,
	StudioCMSMarkdownProcessorOptions,
} from '../types.ts';

/**
 * Default configuration for the markdown processor. This is used as the base for the user's configuration, and is deeply merged with the user's config.
 */
export const markdownConfigDefaults: StudioCMSMarkdownConfig = {
	remarkPlugins: [],
	rehypePlugins: [],
	remarkRehype: {},
	gfm: true,
	smartypants: true,
	shikiConfig: {
		langs: [],
		theme: 'github-dark',
		themes: {},
		wrap: false,
		transformers: [],
		langAlias: {},
	},
	syntaxHighlight: {
		excludeLangs: ['math'],
		type: 'shiki',
	},
	studiocms: {
		callouts: {
			theme: 'obsidian',
		},
		autolink: true,
		discordSubtext: true,
	},
};

/**
 * Creates a Markdown processor with the specified options.
 *
 * @param opts - Optional configuration options for the Markdown processor.
 * @returns A promise that resolves to a MarkdownProcessor instance.
 *
 * @remarks
 * The processor uses unified to parse and transform Markdown content.
 *
 * @example
 * ```typescript
 * const processor = await createMarkdownProcessor({
 *   gfm: true,
 *   smartypants: true,
 * });
 * const result = await processor.render('# Hello World');
 * console.log(result.code);
 * ```
 *
 * @public
 */
export const createMarkdownProcessor = async (
	opts?: StudioCMSMarkdownProcessorOptions
): Promise<MarkdownProcessor> => {
	// TODO: Implement markdown pre-processing logic here, using unified and the provided options to create a processor that can render markdown content.
	return {
		render: async (content, opts): Promise<MarkdownProcessorRenderResult> => {
			const code = ''; // TODO: Implement markdown processing logic here
			return {
				code: String(''),
				astroHTML: new HTMLString(''),
				metadata: {
					headings: [],
					localImagePaths: [],
					remoteImagePaths: [],
					frontmatter: {},
				},
			};
		},
	};
};
