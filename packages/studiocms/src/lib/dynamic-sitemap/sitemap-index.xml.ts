import { sitemaps } from 'virtual:studiocms/sitemaps';
import type { APIContext, APIRoute } from 'astro';

/**
 * Generates an XML sitemap index from an array of entries.
 *
 * @param entries - An array of objects containing the location URLs for the sitemap.
 * @returns A string representing the XML sitemap index.
 *
 * @example
 * const entries = [{ location: 'https://example.com/sitemap1.xml' }, { location: 'https://example.com/sitemap2.xml' }];
 * const sitemapIndex = template(entries);
 * console.log(sitemapIndex);
 * // Output:
 * // <?xml version="1.0" encoding="UTF-8"?>
 * // <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 * //     <sitemap><loc>https://example.com/sitemap1.xml</loc></sitemap>
 * //     <sitemap><loc>https://example.com/sitemap2.xml</loc></sitemap>
 * // </sitemapindex>
 */
const template = (entries: { location: string }[]) => `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${entries.map((entry) => `<sitemap><loc>${entry.location}</loc></sitemap>`).join('')}
</sitemapindex>`;

/**
 * Handles the GET request for generating a dynamic sitemap index.
 *
 * @param context - The API context containing the request information.
 * @returns A Response object containing the generated sitemap index in XML format.
 */
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
