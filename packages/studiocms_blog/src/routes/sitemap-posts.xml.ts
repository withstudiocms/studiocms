import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger, pipe } from 'studiocms/effect';
import { remapFilterSitemap } from '../utils/remapFilter.js';

const template = (entries: { location: string }[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	${entries.map((entry) => `<url><loc>${entry.location}</loc></url>`).join('')}
</urlset>`;

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('@studiocms/blog/routes/sitemap-posts.xml.ts:GET')(function* () {
			const sdk = yield* SDKCore;

			const posts = pipe(
				yield* sdk.GET.pages(),
				remapFilterSitemap('@studiocms/blog', context, true)
			);

			const sitemap = template(posts);

			return new Response(sitemap, {
				status: 200,
				headers: {
					'Content-Type': 'application/xml',
				},
			});
		}).pipe(SDKCore.Provide)
	);
