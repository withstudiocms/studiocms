import { SDKCore } from 'studiocms:sdk';
import { createJsonResponse, Effect, pipe, withEffectAPI } from 'studiocms/effect';
import { remapFilterSitemap } from '../utils/remapFilter.js';

const template = (entries: { location: string }[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	${entries.map((entry) => `<url><loc>${entry.location}</loc></url>`).join('')}
</urlset>`;

export const GET = withEffectAPI(
	Effect.fn(function* (ctx) {
		const sdk = yield* SDKCore;

		const posts = pipe(yield* sdk.GET.pages(), remapFilterSitemap('@studiocms/blog', ctx, true));

		const sitemap = template(posts);

		return new Response(sitemap, {
			status: 200,
			headers: {
				'Content-Type': 'application/xml',
			},
		});
	}),
	{
		cors: { methods: ['GET'], origin: '*' },
		onError: async (error) => {
			console.error('Sitemap API Error:', error);
			return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
		},
	}
);
