import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver } from 'astro-integration-kit';
import { pathWithBase } from 'studiocms/lib/pathGenerators';
import { definePlugin, type StudioCMSPlugin } from 'studiocms/plugins';
import { FrontEndConfigSchema, type StudioCMSBlogOptions } from './types.js';

const packageIdentifier = '@studiocms/blog';

export function internalBlogIntegration(options?: StudioCMSBlogOptions): AstroIntegration {
	// Resolve the options and set defaults
	const resolvedOptions = FrontEndConfigSchema.parse(options);

	const {
		blog: { title, enableRSS, route: orgRoute },
		injectRoutes,
		...frontendConfig
	} = resolvedOptions;

	const route = pathWithBase(orgRoute);

	const resEntrypoint = (path: string) => `@studiocms/blog/routes/${path}`;

	return {
		name: packageIdentifier,
		hooks: {
			'astro:config:setup': async (params) => {
				const { injectRoute } = params;

				if (injectRoutes) {
					injectRoute({
						entrypoint: resEntrypoint('[...slug].astro'),
						pattern: pathWithBase('[...slug]'),
						prerender: false,
					});

					injectRoute({
						entrypoint: resEntrypoint('blog/index.astro'),
						pattern: `${route}`,
						prerender: false,
					});

					injectRoute({
						entrypoint: resEntrypoint('blog/[...slug].astro'),
						pattern: `${route}/[...slug]`,
						prerender: false,
					});

					if (enableRSS) {
						injectRoute({
							entrypoint: resEntrypoint('rss.xml.js'),
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
								title: ${JSON.stringify(title)},
								enableRSS: ${enableRSS},
								route: ${JSON.stringify(route)}
							}
							export default config;
						`,
						'studiocms:blog/frontend-config': `
							const config = ${JSON.stringify(frontendConfig)};
							export default config;
						`,
					},
				});
			},
		},
	};
}

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
	// Resolve the options and set defaults
	const resolvedOptions = FrontEndConfigSchema.parse(options);

	const {
		blog: { title, route: orgRoute },
		sitemap,
	} = resolvedOptions;

	const route = pathWithBase(orgRoute);

	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	const editor = resolve('./components/editor.astro');
	const renderer = resolve('./components/renderer.astro');

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS Blog',
		studiocmsMinimumVersion: '0.1.0-beta.21',
		requires: ['@studiocms/md'],
		hooks: {
			'studiocms:astro:config': ({ addIntegrations }) => {
				addIntegrations(internalBlogIntegration(resolvedOptions));
			},
			'studiocms:config:setup': ({ setFrontend, setRendering, setSitemap }) => {
				setFrontend({
					frontendNavigationLinks: [{ label: title, href: route }],
				});

				setRendering({
					pageTypes: [
						{
							identifier: packageIdentifier,
							label: 'Blog Post (StudioCMS Blog)',
							pageContentComponent: editor,
							rendererComponent: renderer,
						},
					],
				});

				setSitemap({
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
				});
			},
		},
	});
}

export default studioCMSBlogPlugin;
