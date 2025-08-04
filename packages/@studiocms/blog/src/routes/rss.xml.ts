import blogConfig from 'studiocms:blog/config';
import { pathWithBase } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import rss, { type RSSFeedItem } from '@astrojs/rss';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from 'studiocms/effect';

const blogRouteFullPath = `${blogConfig.route}/[...slug]`;

function getBlogRoute(slug: string) {
	if (blogRouteFullPath) {
		return blogRouteFullPath.replace('[...slug]', slug);
	}
	return '#';
}

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('@studiocms/blog/routes/rss.xml:GET')(function* () {
			const sdk = yield* SDKCore;

			const config = context.locals.siteConfig.data;

			// Set Title, Description, and Site
			const title = `${config?.title} | ${blogConfig.title}`;
			const description = config?.description ?? 'Blog';
			const site = context.site ?? 'https://example.com';

			const posts = yield* sdk.GET.pages();

			const orderedPosts = posts
				.map(({ data }) => data)
				.filter(({ package: pkg }) => pkg === '@studiocms/blog');

			const items: RSSFeedItem[] = orderedPosts.map(
				({ title, description, publishedAt: pubDate, slug, categories: categoryData }) => {
					const link = pathWithBase(getBlogRoute(slug));
					const categories = categoryData.map(({ name }) => name);

					return {
						title,
						description,
						...(pubDate ? { pubDate } : {}),
						link,
						categories,
					};
				}
			);

			return rss({ title, description, site, items });
		})
	);
