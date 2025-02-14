import { addVirtualImports, createResolver } from 'astro-integration-kit';
import { pathWithBase } from 'studiocms/lib/pathGenerators.js';
import { definePlugin } from 'studiocms/plugins';

interface StudioCMSBlogOptions {
	/**
	 * The title of the blog
	 */
	title: string;
	/**
	 * Enable RSS feed
	 */
	enableRSS: boolean;
	/**
	 * The route for the blog
	 * @default '/blog'
	 * @example '/news'
	 */
	route: string;
}

const packageIdentifier = '@studiocms/blog';

/**
 * StudioCMS Blog Plugin
 *
 * @param options - The options for the blog plugin
 * @returns The StudioCMS plugin
 */
export function studioCMSBlogPlugin(options?: StudioCMSBlogOptions) {
	const title = options?.title || 'Blog';
	const enableRSS = options?.enableRSS || true;
	const route = options?.route || '/blog';

	const safeRoute = pathWithBase(route);
	const { resolve } = createResolver(import.meta.url);

	return definePlugin({
		identifier: packageIdentifier,
		name: 'StudioCMS Blog',
		studiocmsMinimumVersion: '0.1.0-beta.7',
		frontendNavigationLinks: [{ label: title, href: safeRoute }],
		pageTypes: [{ identifier: packageIdentifier, label: 'Blog Post (StudioCMS Blog)' }],
		integration: {
			name: packageIdentifier,
			hooks: {
				'astro:config:setup': async (params) => {
					const { injectRoute } = params;

					injectRoute({
						entrypoint: resolve('./routes/index.astro'),
						pattern: `${safeRoute}`,
						prerender: false,
					});

					injectRoute({
						entrypoint: resolve('./routes/[...slug].astro'),
						pattern: `${safeRoute}/[...slug]`,
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
                                    route: "${safeRoute}"
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
