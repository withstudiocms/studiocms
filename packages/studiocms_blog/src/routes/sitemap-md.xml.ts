import { pathWithBase } from 'studiocms:lib';
import studioCMS_SDK from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';

const template = (entries: { location: string }[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	${entries.map((entry) => `<url><loc>${entry.location}</loc></url>`).join('')}
</urlset>`;

export const GET: APIRoute = async (context: APIContext) => {
	// Get all Posts from Studio Database
	const orderedPosts = (await studioCMS_SDK.GET.pages())
		.map(({ data }) => data)
		.filter(({ package: pkg }) => pkg === 'studiocms/markdown');

	const sitemapLinks = orderedPosts.map((post) => ({
		location: new URL(pathWithBase(post.slug), context.url).toString(),
	}));

	const sitemap = template(sitemapLinks);

	return new Response(sitemap, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml',
		},
	});
};
