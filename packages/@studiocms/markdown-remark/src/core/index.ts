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
	MarkdownProcessor,
	MarkdownProcessorRenderResult,
	StudioCMSCalloutOptions,
	StudioCMSMarkdownConfig,
	StudioCMSMarkdownProcessorOptions,
} from '../types.ts';
import { loadPlugins } from './load-plugins.ts';
import { rehypeAutolinkOptions, rehypeCallouts, rehypeImages } from './rehype-plugins/index.ts';
import { remarkCollectImages, remarkDiscordSubtext } from './remark-plugins/index.ts';

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
	const {
		// TODO: Add syntax highlighting support back in via plugins
		// syntaxHighlight = markdownConfigDefaults.syntaxHighlight,
		// shikiConfig = markdownConfigDefaults.shikiConfig,
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

	const loadedRemarkPlugins = await Promise.all(loadPlugins(remarkPlugins));
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

	// Apply later in case user plugins resolve relative image paths
	parser.use(remarkCollectImages, opts?.image);

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

	// Images / Assets support
	parser.use(rehypeImages);

	// Autolink headings
	if (autolink) {
		parser.use(rehypeAutoLink, rehypeAutolinkOptions);
	}

	// Callouts
	if (calloutsEnabled) {
		parser.use(rehypeCallouts, calloutsConfig);
	}

	// Stringify to HTML
	parser.use(rehypeRaw).use(rehypeStringify, { allowDangerousHtml: true });

	return {
		render: async (content, opts): Promise<MarkdownProcessorRenderResult> => {
			const vfile = new VFile({
				value: content,
				path: opts?.fileURL,
				data: {
					astro: {
						frontmatter: opts?.frontmatter ?? {},
					},
				},
			});

			const result = await parser.process(vfile).catch((err) => {
				// Ensure that the error message contains the input filename
				// to make it easier for the user to fix the issue
				const newErr = prefixError(err, `Failed to parse Markdown file "${vfile.path}"`);
				console.error(newErr);
				throw newErr;
			});

			const code = result.value;

			return {
				code: String(code),
				astroHTML: new HTMLString(code),
				metadata: {
					headings: result.data.astro?.headings ?? [],
					localImagePaths: result.data.astro?.localImagePaths ?? [],
					remoteImagePaths: result.data.astro?.remoteImagePaths ?? [],
					frontmatter: result.data.astro?.frontmatter ?? {},
				},
			};
		},
	};
};
