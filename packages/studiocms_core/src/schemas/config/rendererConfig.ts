import { z } from 'astro/zod';
import { markdocConfigSchema, type markdocRenderer } from './markdoc';
import { mdxConfigSchema } from './mdx';

export type Renderer = (content: string) => Promise<string>;
export type { markdocRenderer };

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
				z.literal('astro'),
				z.literal('markdoc'),
				z.literal('mdx'),
				z.custom<CustomRenderer>(),
			])
			.optional()
			.default('astro'),
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
	})
	.optional()
	.default({});

/**
 * Type for the StudioCMS Renderer Configuration
 */
export type StudioCMSRendererConfig = z.infer<typeof StudioCMSRendererConfigSchema>;
