import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

const commonHeaders = {
	'Content-Type': 'application/json',
};

export const { ALL, OPTIONS, GET } = createEffectAPIRoutes(
	{
		GET: () =>
			genLogger('routes/sdk/list-pages/GET')(function* () {
				const sdk = yield* SDKCore;
				const pages = yield* sdk.GET.pages();

				const lastUpdated = new Date().toISOString();

				return new Response(JSON.stringify({ lastUpdated, pages }, null, 2), {
					headers: {
						...commonHeaders,
						Date: lastUpdated,
					},
				});
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
				headers: { ...commonHeaders },
			});
		},
	}
);
