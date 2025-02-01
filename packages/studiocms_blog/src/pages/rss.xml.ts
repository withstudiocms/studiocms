import config from '@studiocms/blog:config';
import { pages } from '@studiocms/blog:context';
import { pathWithBase } from 'studiocms:lib';
import studioCMS_SDK from 'studiocms:sdk';
import rss, { type RSSFeedItem } from '@astrojs/rss';
import type { APIContext } from 'astro';
import { name } from '../../package.json';

const blogRouteFullPath = pages.get('/blog/[...slug]');

function getBlogRoute(slug: string) {
	if (blogRouteFullPath) {
		return blogRouteFullPath.replace('[...slug]', slug);
	}
	return '#';
}

export async function GET(context: APIContext) {
	// Get Config from Studio Database
	const studioCMSConfig = await studioCMS_SDK.GET.database.config();

	// Set Title, Description, and Site
	const title = config.title ?? studioCMSConfig?.title ?? 'Blog';
	const description = config.description ?? studioCMSConfig?.description ?? 'Blog';
	const site = context.site ?? 'https://example.com';

	// Get all Posts from Studio Database
	const orderedPosts = await studioCMS_SDK.GET.packagePages(name);

	const items: RSSFeedItem[] = orderedPosts.map((post) => {
		return {
			title: post.title,
			description: post.description,
			pubDate: post.publishedAt,
			link: pathWithBase(getBlogRoute(post.slug)),
			categories: post.categories.map(({ name }) => name),
		};
	});

	return rss({ title, description, site, items });
}
