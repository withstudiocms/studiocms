import { sitemaps } from 'virtual:studiocms/sitemaps';
import type { APIContext, APIRoute } from 'astro';

const template = (entries: { location: string }[]) => `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${entries.map((entry) => `<sitemap><loc>${entry.location}</loc></sitemap>`).join('')}
</sitemapindex>`;

export const GET: APIRoute = async (context: APIContext) => {
	const CurrentUrl = context.url;

	const sitemap = template(
		sitemaps.map((sitemap) => ({ location: new URL(sitemap, CurrentUrl).toString() }))
	);

	return new Response(sitemap, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml',
		},
	});
};
