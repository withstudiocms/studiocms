import type { AstroIntegration } from 'astro';
import { Schema } from 'effect';
import { pathWithBase } from 'studiocms/lib/pathGenerators';
import { definePlugin } from 'studiocms/plugins';
import type { StudioCMSPluginDef } from 'studiocms/schemas';
import { FrontEndConfigSchema, type StudioCMSBlogOptions } from './types.js';

const packageIdentifier = '@studiocms/blog';

function virtualImportsPlugin(name: string, imports: Record<string, string>) {
	return {
		name,
		resolveId(id: string) {
			if (id in imports) return `\0${id}`;
		},
		load(id: string) {
			if (id.startsWith('\0')) return imports[id.slice(1)];
		},
	};
}

function resolve(path: string) {
	return new URL(path, import.meta.url).toString();
}

export function internalBlogIntegration(options: StudioCMSBlogOptions = {}): AstroIntegration {
	// Resolve the options and set defaults
	const resolvedOptions = Schema.decodeSync(FrontEndConfigSchema)(options);

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
			/* v8 ignore start */
			/* this is tested indirectly via the plugin tests */
			'astro:config:setup': async (params) => {
				const { injectRoute, updateConfig } = params;

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

				updateConfig({
					vite: {
						plugins: [
							virtualImportsPlugin(packageIdentifier, {
								'studiocms:blog/config': `
									const config = { title: ${JSON.stringify(title)}, enableRSS: ${enableRSS}, route: ${JSON.stringify(route)} }; 
									export default config;
								`,
								'studiocms:blog/frontend-config': `
									const config = ${JSON.stringify(frontendConfig)}; 
									export default config;
								`,
							}),
						],
					},
				});
			},
			/* v8 ignore stop */
		},
	};
}

/**
 * Creates and configures the StudioCMS Blog plugin.
 *
 * @param {StudioCMSBlogOptions} [options] - Optional configuration options for the blog plugin.
 * @returns {StudioCMSPluginDef} The configured StudioCMS plugin.
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
export function studioCMSBlogPlugin(options: StudioCMSBlogOptions = {}): StudioCMSPluginDef {
	// Resolve the options and set defaults
	const resolvedOptions = Schema.decodeSync(FrontEndConfigSchema)(options);

	const {
		blog: { title, route: orgRoute },
		sitemap,
	} = resolvedOptions;

	const route = pathWithBase(orgRoute);

	const editor = resolve('./components/editor.astro');
	const renderer = resolve('./components/render.js');

	// Return the plugin configuration
	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS Blog',
		requires: ['@studiocms/md'],
		hooks: {
			'studiocms:astro-config': async ({ addIntegrations }) => {
				addIntegrations(internalBlogIntegration(resolvedOptions));
			},
			'studiocms:frontend': async ({ setFrontend }) => {
				setFrontend({
					frontendNavigationLinks: [{ label: title, href: route }],
				});
			},
			'studiocms:rendering': async ({ setRendering }) => {
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
			},
			'studiocms:sitemap': async ({ setSitemap }) => {
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
