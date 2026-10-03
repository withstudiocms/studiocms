import type {
	MarkdownProcessor,
	MarkdownProcessorRenderResult,
} from '@withstudiocms/internal_helpers/markdown';
import { HTMLString } from 'astro/runtime/server/escape.js';
import rehypeAutoLink from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkSmartypants from 'remark-smartypants';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { prefixError } from '../errors.ts';
import type {
	StudioCMSCalloutOptions,
	StudioCMSMarkdownConfig,
	StudioCMSMarkdownOptions,
} from '../types.ts';
import { loadPlugins } from './plugin-utils/load-plugins.ts';
import { rehypeAutolinkOptions, rehypeCallouts } from './rehype-plugins/index.ts';
import { remarkDiscordSubtext } from './remark-plugins/index.ts';

/**
 * Default configuration for the markdown processor. This is used as the base for the user's configuration, and is deeply merged with the user's config.
 */
export const markdownConfigDefaults: StudioCMSMarkdownConfig = {
	remarkPlugins: [],
	rehypePlugins: [],
	remarkRehype: {},
	gfm: true,
	smartypants: true,
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
	opts?: StudioCMSMarkdownOptions
): Promise<MarkdownProcessor> => {
	const {
		remarkPlugins = markdownConfigDefaults.remarkPlugins,
		rehypePlugins = markdownConfigDefaults.rehypePlugins,
		remarkRehype: remarkRehypeOptions = markdownConfigDefaults.remarkRehype,
		gfm = markdownConfigDefaults.gfm,
		smartypants = markdownConfigDefaults.smartypants,
		studiocms = markdownConfigDefaults.studiocms,
	} = opts ?? {};

	let autolink = true;
	let calloutsEnabled = true;
	let calloutsConfig: StudioCMSCalloutOptions = { theme: 'obsidian' };
	let discordSubtext = true;

	if (typeof studiocms === 'boolean') {
		autolink = studiocms;
		calloutsEnabled = studiocms;
		discordSubtext = studiocms;
	} else if (typeof studiocms === 'object') {
		autolink = studiocms.autolink ?? autolink;
		calloutsEnabled = studiocms.callouts !== false;
		if (typeof studiocms.callouts === 'object') {
			calloutsConfig = studiocms.callouts;
		}
		discordSubtext = studiocms.discordSubtext ?? discordSubtext;
	}
	// Load user remark plugins.
	const loadedRemarkPlugins = await Promise.all(loadPlugins(remarkPlugins));

	// Load user rehype plugins.
	const loadedRehypePlugins = await Promise.all(loadPlugins(rehypePlugins));

	// Initialize the parser
	const parser = unified().use(remarkParse);

	// gfm
	if (gfm) {
		parser.use(remarkGfm);
	}

	// smartypants
	if (smartypants) {
		parser.use(remarkSmartypants);
	}

	// Discord subtext
	if (discordSubtext) {
		parser.use(remarkDiscordSubtext);
	}

	// User remark plugins
	for (const [plugin, pluginOpts] of loadedRemarkPlugins) {
		parser.use(plugin, pluginOpts);
	}

	// Remark -> Rehype
	parser.use(remarkRehype, {
		allowDangerousHtml: true,
		passThrough: [],
		...remarkRehypeOptions,
	});

	// User rehype plugins
	for (const [plugin, pluginOpts] of loadedRehypePlugins) {
		parser.use(plugin, pluginOpts);
	}

	// Autolink headings
	if (autolink) {
		parser.use(rehypeAutoLink, rehypeAutolinkOptions);
	}

	// Callouts
	if (calloutsEnabled) {
		parser.use(rehypeCallouts, calloutsConfig);
	}

	// Stringify to HTML
	parser.use(rehypeRaw).use(rehypeStringify, {
		allowDangerousHtml: true,
	});

	// We assign the parser to a separate variable to ensure that the type is correctly inferred for the render function below. If we use _parser directly, TypeScript may not correctly infer the type of the unified processor, which can lead to issues with type checking in the render function.
	const liveParser = parser;

	return {
		render: async (content, opts): Promise<MarkdownProcessorRenderResult> => {
			// Create a VFile for the content, which allows us to pass metadata and the file path to plugins that need it
			const vfile = new VFile({
				value: content,
				path: opts?.fileURL,
				data: {
					astro: {
						frontmatter: opts?.frontmatter ?? {},
					},
				},
			});

			// Process the content through the unified processor, which will run it through all the remark and rehype plugins we set up above. We catch any errors that occur during processing to add additional context about which file caused the error, which can help users debug issues with their markdown content.
			const result = await liveParser.process(vfile).catch((err) => {
				// Ensure that the error message contains the input filename
				// to make it easier for the user to fix the issue
				const newErr = prefixError(err, `Failed to parse Markdown file "${vfile.path}"`);
				console.error(newErr);
				throw newErr;
			});

			// Extract the resulting HTML value.
			const code = result.value;

			// Return the rendered code, an HTMLString instance for use in Astro, and metadata about the rendered content such as headings and image paths.
			return {
				code: String(code),
				astroHTML: new HTMLString(code),
			};
		},
	};
};
