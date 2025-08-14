import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

export const { ALL, OPTIONS, GET } = createEffectAPIRoutes(
	{
		GET: () =>
			genLogger('routes/sdk/list-pages/GET')(function* () {
				const sdk = yield* SDKCore;
				const pages = yield* sdk.GET.pages();

				const lastUpdated = new Date().toISOString();

				return createJsonResponse({ lastUpdated, pages });
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'OPTIONS'] },
		onError: (error) => {
			const status =
				typeof error === 'object' &&
				error !== null &&
				// biome-ignore lint/suspicious/noExplicitAny: Allows for better error handling
				'status' in (error as any) &&
				// biome-ignore lint/suspicious/noExplicitAny: Allows for better error handling
				typeof (error as any).status === 'number'
					? // biome-ignore lint/suspicious/noExplicitAny: Allows for better error handling
						(error as any).status
					: 500;
			const message =
				// biome-ignore lint/suspicious/noExplicitAny: Allows for better error handling
				status >= 500 ? 'Something went wrong' : ((error as any)?.message ?? 'Request failed');
			console.error('routes/sdk/list-pages error', { status, message });
			return createJsonResponse({ error: message }, { status });
		},
	}
);
