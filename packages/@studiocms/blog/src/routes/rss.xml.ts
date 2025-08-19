import blogConfig from 'studiocms:blog/config';
import { pathWithBase } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import rss, { type RSSFeedItem } from '@astrojs/rss';
import { createJsonResponse, Effect, withEffectAPI } from 'studiocms/effect';

const blogRouteFullPath = `${blogConfig.route}/[...slug]`;

function getBlogRoute(slug: string) {
	if (blogRouteFullPath) {
		return blogRouteFullPath.replace('[...slug]', slug);
	}
	return '#';
}

export const GET = withEffectAPI(
	Effect.fn(function* ({ site: _site, locals }) {
		const sdk = yield* SDKCore;

		const config = locals?.StudioCMS?.siteConfig?.data;

		// Set Title, Description, and Site
		const siteTitle = config?.title ?? 'StudioCMS';
		const title = `${siteTitle} | ${blogConfig.title}`;
		const description = config?.description ?? 'Blog';
		const site = _site ?? 'https://example.com';

		const posts = yield* sdk.GET.pages();

		const sortedPosts = posts
			.map(({ data }) => data)
			.filter(({ package: pkg }) => pkg === '@studiocms/blog')
			.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

		const items: RSSFeedItem[] = sortedPosts.map(
			({ title, description, publishedAt, slug, categories: categoryData }) => {
				const link = pathWithBase(getBlogRoute(slug));
				const categories = (categoryData ?? []).map(({ name }) => name);
				const pubDate = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;

				return {
					title,
					description,
					pubDate,
					link,
					categories,
				};
			}
		);

		return rss({ title, description, site, items });
	}),
	{
		cors: { methods: ['GET'], origin: '*' },
		onError: async (error) => {
			console.error('Error generating RSS feed:', error);
			return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
		},
	}
);
