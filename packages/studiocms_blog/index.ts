import defineTheme from 'astro-theme-provider';
import { definePlugin } from 'studiocms';
import { name } from './package.json';
import { studioCMSBlogSchema as schema } from './schema';

const studioCMSBlogTheme = defineTheme({
	name,
	schema,
});

/**
 * User definable options for the StudioCMS Blog Theme
 */
export type ATP_ThemeOptions = Parameters<typeof studioCMSBlogTheme>[0];

/**
 * **StudioCMS Blog Theme(Integration)**
 *
 * **Powered by [`astro-theme-provider`](https://github.com/astrolicious/astro-theme-provider) by [Bryce Russell](https://github.com/BryceRussell)**
 *
 * This theme provides a Blog Index Page and RSS Feed for your StudioCMS Site as well as route handling for Blog Posts.
 */
export function blogPlugin(options?: ATP_ThemeOptions) {
	// User definable options for the StudioCMS Blog Theme
	const slug = typeof options?.pages?.['/blog'] === 'string' ? options.pages['/blog'] : 'blog/';

	// Return the StudioCMS Plugin
	return definePlugin({
		name,
		studiocmsMinimumVersion: '0.1.0-beta.8',
		identifier: 'StudioCMS Blog',
		integration: studioCMSBlogTheme(options),
		frontendNavigationLinks: [{ label: 'Blog', href: slug }],
	});
}

export default blogPlugin;
