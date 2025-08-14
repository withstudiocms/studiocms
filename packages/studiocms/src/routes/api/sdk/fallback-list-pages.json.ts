import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

export const { ALL, OPTIONS, GET } = createEffectAPIRoutes(
	{
		GET: () =>
			genLogger('routes/sdk/fallback-list-pages.json/GET')(function* () {
				const sdk = yield* SDKCore;
				const pages = yield* sdk.GET.pages();
				const lastUpdated = new Date().toISOString();

				return new Response(
					JSON.stringify({ lastUpdated, pages: pages.map((pageItem) => pageItem.data) }, null, 2),
					{
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*',
							'Cache-Control': 'public, max-age=604800, immutable',
							Date: new Date(lastUpdated).toUTCString(),
						},
					}
				);
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return new Response(JSON.stringify({ error: 'Something went wrong' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		},
	}
);
