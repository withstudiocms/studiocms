import { extname } from 'node:path';
import { z } from 'astro/zod';
import { HeadConfigSchema } from 'studiocms/lib/head.js';

export type HeadUserConfig = z.input<ReturnType<typeof HeadConfigSchema>>;
export type HeadConfig = z.output<ReturnType<typeof HeadConfigSchema>>;

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
		 * Enable sitemap generation
		 * @default true
		 */
		sitemap: z.boolean().optional().default(true),

		/**
		 * Inject routes
		 * @default true
		 */
		injectRoutes: z.boolean().optional().default(true),

		/**
		 * The configuration for the blog
		 */
		blog: z.object({
			/**
			 * The title of the blog
			 */
			title: z.string().optional().default('Blog'),

			/**
			 * Enable RSS feed
			 */
			enableRSS: z.boolean().optional().default(true),

			/**
			 * The route for the blog
			 * @default '/blog'
			 * @example '/news'
			 */
			route: z.string().optional().default('/blog')
		}).optional().default({})

	})
	.optional()
	.default({});

export type StudioCMSBlogOptions = z.infer<typeof FrontEndConfigSchema>;


// /**
//  * Options for configuring the StudioCMS Blog.
//  */
// export interface StudioCMSBlogOptions {
// 	/**
// 	 * Enable sitemap generation
// 	 * @default true
// 	 */
// 	sitemap?: boolean;

// 	/**
// 	 * Inject routes
// 	 * @default true
// 	 */
// 	injectRoutes?: boolean;

// 	/**
// 	 * The configuration for the blog
// 	 */
// 	blog?: {
// 		/**
// 		 * The title of the blog
// 		 */
// 		title?: string;

// 		/**
// 		 * Enable RSS feed
// 		 */
// 		enableRSS?: boolean;

// 		/**
// 		 * The route for the blog
// 		 * @default '/blog'
// 		 * @example '/news'
// 		 */
// 		route?: string;
// 	};
// }
