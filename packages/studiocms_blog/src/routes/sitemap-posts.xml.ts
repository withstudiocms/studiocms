import blogConfig from 'studiocms:blog/config';
import { pathWithBase } from 'studiocms:lib';
import studioCMS_SDK from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';

const blogRouteFullPath = `${blogConfig.route}/[...slug]`;

function getBlogRoute(slug: string) {
	if (blogRouteFullPath) {
		return blogRouteFullPath.replace('[...slug]', slug);
	}
	return '#';
}

const template = (entries: { location: string }[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	${entries.map((entry) => `<url><loc>${entry.location}</loc></url>`).join('')}
</urlset>`;

export const GET: APIRoute = async (context: APIContext) => {
	// Get all Posts from Studio Database
	const orderedPosts = (await studioCMS_SDK.GET.pages())
		.map(({ data }) => data)
		.filter(({ package: pkg }) => pkg === '@studiocms/blog');

	const sitemapLinks = orderedPosts.map((post) => ({
		location: new URL(pathWithBase(getBlogRoute(post.slug)), context.url).toString(),
	}));

	const sitemap = template(sitemapLinks);

	return new Response(sitemap, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml',
		},
	});
};
