import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '@withstudiocms/effect';
import { createSimplePathRouter } from '#frontend/utils/rest-router.js';
import { OAuthAPIEffect } from './_effects';

const indexRoute = createEffectAPIRoutes(
	{
		GET: (ctx) =>
			genLogger('studiocms/routes/api/auth/[provider]/index.GET')(function* () {
				const { initSession } = yield* OAuthAPIEffect;
				return yield* initSession(ctx);
			}).pipe(OAuthAPIEffect.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse(
				{ error: 'Internal Server Error' },
				{
					status: 500,
				}
			);
		},
	}
);

const router = {
	__index: indexRoute,
	index: indexRoute,
	callback: createEffectAPIRoutes(
		{
			GET: (ctx) =>
				genLogger('studiocms/routes/api/auth/[provider]/callback.GET')(function* () {
					const { initCallback } = yield* OAuthAPIEffect;
					return yield* initCallback(ctx);
				}).pipe(OAuthAPIEffect.Provide),
			OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
			ALL: () => Effect.try(() => AllResponse()),
		},
		{
			cors: { methods: ['GET', 'OPTIONS'] },
			onError: (error) => {
				console.error('API Error:', error);
				return createJsonResponse(
					{ error: 'Internal Server Error' },
					{
						status: 500,
					}
				);
			},
		}
	),
};

export const ALL = createSimplePathRouter('studiocms:auth', router);
