import logger from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	OptionsResponse,
} from '../../../../effect.js';

export const { ALL, OPTIONS, GET } = createEffectAPIRoutes(
	{
		GET: () =>
			SDKCore.pipe(
				Effect.flatMap((sdk) => sdk.UPDATE.latestVersion()),
				Effect.map((latestVersion) => createJsonResponse({ success: true, latestVersion }))
			),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'OPTIONS'] },
		onError: (error) => {
			logger.error(`API Error: ${(error as Error).message}`);
			return createJsonResponse(
				{ error: 'Something went wrong' },
				{
					status: 500,
				}
			);
		},
	}
);
