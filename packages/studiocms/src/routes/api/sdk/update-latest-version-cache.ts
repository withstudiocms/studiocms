import logger from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

const createJsonResponse = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			Date: new Date().toUTCString(),
		},
	});

export const { ALL, OPTIONS, GET } = createEffectAPIRoutes(
	{
		GET: () =>
			genLogger('routes/sdk/update-latest-version-cache/GET')(function* () {
				const sdk = yield* SDKCore;
				const latestVersion = yield* sdk.UPDATE.latestVersion();

				return createJsonResponse({ success: true, latestVersion });
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'OPTIONS'] },
		onError: (error) => {
			logger.error(`API Error: ${(error as Error).message}`);
			return createJsonResponse({ error: 'Something went wrong' }, 500);
		},
	}
);
