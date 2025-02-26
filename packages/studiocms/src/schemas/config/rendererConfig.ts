import { z } from 'astro/zod';
import { type MarkdocRenderer, markdocConfigSchema, type markdocRenderer } from './markdoc.js';
import { mdxConfigSchema } from './mdx.js';
import {
	StudioCMSMarkdownExtendedSchema,
	TransformToProcessor,
} from './studiocms-markdown-remark.js';

export type Renderer = (content: string) => Promise<string>;
export type { markdocRenderer, MarkdocRenderer };

export { TransformToProcessor };

/**
 * Custom Renderer Type
 * @description A custom renderer that can be used in StudioCMS
 * @property {string} name - The name of the renderer
 * @property {Renderer} renderer - The renderer function
 * @example
 * ```ts
 * const customRenderer: CustomRenderer = {
 * 	name: 'custom',
 * 	renderer: async (content: string) => {
 * 		return content;
 * 	},
 * };
 */
export interface CustomRenderer {
	name: string;
	renderer: Renderer;
}

/**
 * StudioCMS Renderer Configuration Schema
 *
 * Allows customization of the current renderer being used
 */
export const StudioCMSRendererConfigSchema = z
	.object({
		/**
		 * The Markdown Content Renderer to use for rendering pages and posts
		 *
		 * Astro is the built-in Astro remark-markdown plugin.
		 * @see https://www.npmjs.com/package/@astrojs/markdown-remark
		 *
		 * Markdoc is a powerful, flexible, Markdown-based authoring framework. Built by Stripe.
		 * @see https://markdoc.dev/ for more info about markdoc.
		 *
		 */
		renderer: z
			.union([
				z.literal('studiocms'),
				z.literal('astro'),
				z.literal('markdoc'),
				z.literal('mdx'),
				z.custom<CustomRenderer>(),
			])
			.optional()
			.default('studiocms'),
		/**
		 * Allows customization of the Markdoc Configuration
		 *
		 * Markdoc is a powerful, flexible, Markdown-based authoring framework. Built by Stripe.
		 * @see https://markdoc.dev/ for more info about markdoc.
		 */
		markdocConfig: markdocConfigSchema,
		/**
		 * Allows customization of the MDX Configuration
		 *
		 * MDX is a JSX in Markdown loader, parser, and renderer for ambitious projects.
		 * @see https://mdxjs.com/ for more info about MDX.
		 */
		mdxConfig: mdxConfigSchema,

		/**
		 * Allows customization of the StudioCMS Markdown Extended Configuration
		 *
		 * StudioCMS Markdown Extended is a collection of custom markdown features for StudioCMS.
		 * @see https://github.com/withstudiocms/markdown-remark/tree/main for more info about StudioCMS Markdown Extended.
		 */
		studiocms: StudioCMSMarkdownExtendedSchema,
	})
	.optional()
	.default({});

/**
 * Type for the StudioCMS Renderer Configuration
 */
export type StudioCMSRendererConfig = z.infer<typeof StudioCMSRendererConfigSchema>;
