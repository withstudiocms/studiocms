import { extname } from 'node:path';
import { z } from 'astro/zod';

export const HeadConfigSchema = () =>
	z
		.array(
			z.object({
				/** Name of the HTML tag to add to `<head>`, e.g. `'meta'`, `'link'`, or `'script'`. */
				tag: z.enum(['title', 'base', 'link', 'style', 'meta', 'script', 'noscript', 'template']),
				/** Attributes to set on the tag, e.g. `{ rel: 'stylesheet', href: '/custom.css' }`. */
				attrs: z.record(z.union([z.string(), z.boolean(), z.undefined()])).default({}),
				/** Content to place inside the tag (optional). */
				content: z.string().default(''),
			})
		)
		.default([]);

const faviconTypeMap = {
	'.ico': 'image/x-icon',
	'.gif': 'image/gif',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
};

function isFaviconExt(ext: string): ext is keyof typeof faviconTypeMap {
	return ext in faviconTypeMap;
}

export type HeadUserConfig = z.input<ReturnType<typeof HeadConfigSchema>>;
export type HeadConfig = z.output<ReturnType<typeof HeadConfigSchema>>;

export const FrontEndConfigSchema = z
	.object({
		/**
		 * HTML Default Language - The default language for the HTML tag
		 * @default 'en'
		 */
		htmlDefaultLanguage: z.string().optional().default('en'),
		/**
		 * HTML Default Header - The default head configuration for the Frontend
		 */
		htmlDefaultHead: HeadConfigSchema(),
		/**
		 * Favicon Configuration - The default favicon configuration for the Frontend
		 */
		favicon: z
			.string()
			.refine(
				(fav) => {
					const ext = extname(fav);
					return isFaviconExt(ext);
				},
				{
					message: 'favicon must be a .ico, .gif, .jpg, .png, or .svg file',
				}
			)
			.optional()
			.default('/favicon.svg'),

		/**
		 * Enable Quick Actions Menu - Whether to enable the quick actions menu
		 * @default true
		 */
		injectQuickActionsMenu: z.boolean().optional().default(true),
	})
	.optional()
	.default({});

export const DefaultFrontEndConfigSchema = z
	.union([FrontEndConfigSchema, z.boolean()])
	.optional()
	.default({});
