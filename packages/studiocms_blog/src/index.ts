import { addVirtualImports, createResolver } from 'astro-integration-kit';
import { pathWithBase } from 'studiocms/lib/pathGenerators.js';
import { type StudioCMSPlugin, definePlugin } from 'studiocms/plugins';
import type { StudioCMSBlogOptions } from './types.js';

const packageIdentifier = '@studiocms/blog';

/**
 * Creates and configures the StudioCMS Blog plugin.
 *
 * @param {StudioCMSBlogOptions} [options] - Optional configuration options for the blog plugin.
 * @returns {StudioCMSPlugin} The configured StudioCMS plugin.
 *
 * @remarks
 * This function sets up the StudioCMS Blog plugin with the provided options or default values.
 * It configures the plugin's identifier, name, minimum version, frontend navigation links, page types,
 * sitemap settings, and integration hooks.
 *
 * @example
 * ```typescript
 * const blogPlugin = studioCMSBlogPlugin({
 *   blog: {
 *     title: 'My Blog',
 *     enableRSS: true,
 *     route: '/my-blog'
 *   },
 *   sitemap: true,
 *   injectRoutes: true
 * });
 * ```
 *
 * @param {StudioCMSBlogOptions} [options.blog] - Blog-specific options.
 * @param {string} [options.blog.title] - The title of the blog. Defaults to 'Blog'.
 * @param {boolean} [options.blog.enableRSS] - Whether to enable RSS feed. Defaults to true.
 * @param {string} [options.blog.route] - The route for the blog. Defaults to '/blog'.
 * @param {boolean} [options.sitemap] - Whether to trigger sitemap generation. Defaults to true.
 * @param {boolean} [options.injectRoutes] - Whether to inject routes for the blog. Defaults to true.
 */
export function studioCMSBlogPlugin(options?: StudioCMSBlogOptions): StudioCMSPlugin {
	// Resolve the options and set defaults if not provided
	const title = options?.blog?.title || 'Blog';
	const enableRSS = options?.blog?.enableRSS || true;
	const route = pathWithBase(options?.blog?.route || '/blog');
	const sitemap = options?.sitemap ?? true;
	const injectRoutes = options?.injectRoutes ?? true;

	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS Blog',
		// TODO: Update this to the correct version when the package is ready to be published
		studiocmsMinimumVersion: '0.1.0-beta.8',
		frontendNavigationLinks: [{ label: title, href: route }],
		pageTypes: [{ identifier: packageIdentifier, label: 'Blog Post (StudioCMS Blog)' }],
		triggerSitemap: sitemap,
		sitemaps: [
			{
				pluginName: packageIdentifier,
				sitemapXMLEndpointPath: resolve('./routes/sitemap-posts.xml.js'),
			},
			{
				pluginName: 'pages',
				sitemapXMLEndpointPath: resolve('./routes/sitemap-md.xml.js'),
			},
		],
		integration: {
			name: packageIdentifier,
			hooks: {
				'astro:config:setup': async (params) => {
					const { injectRoute } = params;

					if (injectRoutes) {
						injectRoute({
							entrypoint: '@studiocms/blog/routes/[...slug].astro',
							pattern: pathWithBase('[...slug]'),
							prerender: false,
						});

						injectRoute({
							entrypoint: '@studiocms/blog/routes/blog/index.astro',
							pattern: `${route}`,
							prerender: false,
						});

						injectRoute({
							entrypoint: '@studiocms/blog/routes/blog/[...slug].astro',
							pattern: `${route}/[...slug]`,
							prerender: false,
						});

						if (enableRSS) {
							injectRoute({
								entrypoint: '@studiocms/blog/routes/rss.xml.js',
								pattern: pathWithBase('rss.xml'),
								prerender: false,
							});
						}
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
