import { addVirtualImports, createResolver } from 'astro-integration-kit';
import { pathWithBase } from 'studiocms/lib/pathGenerators.js';
import { definePlugin } from 'studiocms/plugins';

interface StudioCMSBlogOptions {
	/**
	 * Enable sitemap generation
	 * @default true
	 */
	sitemap?: boolean;
	/**
	 * The configuration for the blog
	 */
	blog?: {
		/**
		 * The title of the blog
		 */
		title?: string;
		/**
		 * Enable RSS feed
		 */
		enableRSS?: boolean;
		/**
		 * The route for the blog
		 * @default '/blog'
		 * @example '/news'
		 */
		route?: string;
	};
}

const packageIdentifier = '@studiocms/blog';

/**
 * StudioCMS Blog Plugin
 *
 * @param options - The options for the blog plugin
 * @returns The StudioCMS plugin
 */
export function studioCMSBlogPlugin(options?: StudioCMSBlogOptions) {
	// Resolve the options and set defaults if not provided
	const title = options?.blog?.title || 'Blog';
	const enableRSS = options?.blog?.enableRSS || true;
	const route = pathWithBase(options?.blog?.route || '/blog');
	const sitemap = options?.sitemap ?? true;

	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS Blog',
		// TODO: Update this to the correct version when the package is ready to be published
		studiocmsMinimumVersion: '0.1.0-beta.7',
		frontendNavigationLinks: [{ label: title, href: route }],
		pageTypes: [{ identifier: packageIdentifier, label: 'Blog Post (StudioCMS Blog)' }],
		triggerSitemap: sitemap,
		integration: {
			name: packageIdentifier,
			hooks: {
				'astro:config:setup': async (params) => {
					const { injectRoute } = params;

					injectRoute({
						entrypoint: resolve('./routes/[...slug].astro'),
						pattern: pathWithBase('[...slug]'),
						prerender: false,
					});

					injectRoute({
						entrypoint: resolve('./routes/blog/index.astro'),
						pattern: `${route}`,
						prerender: false,
					});

					injectRoute({
						entrypoint: resolve('./routes/blog/[...slug].astro'),
						pattern: `${route}/[...slug]`,
						prerender: false,
					});

					if (enableRSS) {
						injectRoute({
							entrypoint: resolve('./routes/rss.xml.js'),
							pattern: pathWithBase('rss.xml'),
							prerender: false,
						});
					}

					addVirtualImports(params, {
						name: packageIdentifier,
						imports: {
							'studiocms:blog/config': `
							const config = {
								title: "${title}",
								enableRSS: ${enableRSS},
								route: "${route}"
							}
							export default config;
						`,
						},
					});
				},
			},
		},
	});
}

export default studioCMSBlogPlugin;
