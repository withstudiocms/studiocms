import blogConfig from 'studiocms:blog/config';
import { pathWithBase } from 'studiocms:lib';
import studioCMS_SDK from 'studiocms:sdk';
import rss, { type RSSFeedItem } from '@astrojs/rss';
import type { APIContext } from 'astro';

const blogRouteFullPath = `${blogConfig.route}/[...slug]`;

function getBlogRoute(slug: string) {
	if (blogRouteFullPath) {
		return blogRouteFullPath.replace('[...slug]', slug);
	}
	return '#';
}

export async function GET(context: APIContext) {
	// Get Config from Studio Database
	const config = (await studioCMS_SDK.GET.database.config()) || {
		title: 'StudioCMS - Database Unavailable',
		description: 'StudioCMS - Database Unavailable',
	};

	// Set Title, Description, and Site
	const title = `${config?.title} | ${blogConfig.title}`;
	const description = config?.description ?? 'Blog';
	const site = context.site ?? 'https://example.com';

	// Get all Posts from Studio Database
	const orderedPosts = await studioCMS_SDK.GET.packagePages('@studiocms/blog');

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
