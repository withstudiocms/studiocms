import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	OptionsResponse,
} from '@withstudiocms/effect';

export const { ALL, OPTIONS, GET } = createEffectAPIRoutes(
	{
		GET: () =>
			SDKCore.pipe(
				Effect.flatMap((sdk) => sdk.GET.pages()),
				Effect.map((pages) => {
					const lastUpdated = new Date().toISOString();
					return { lastUpdated, pages };
				}),
				Effect.map((data) => createJsonResponse(data))
			),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
		},
	}
);
