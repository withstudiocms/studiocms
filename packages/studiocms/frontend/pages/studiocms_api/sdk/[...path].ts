import logger from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	type HTTPMethod,
	OptionsResponse,
} from '@withstudiocms/effect';
import { createSimplePathRouter } from '#frontend/utils/rest-router.js';
import { ProcessChangelog } from './utils/changelog.js';

const optionsFn = (allowedMethods: string[]) => () =>
	Effect.try(() => OptionsResponse({ allowedMethods }));

const allFn = () => Effect.try(() => AllResponse());

const cors = (method: string) => ({ methods: [method, 'OPTIONS'] }) as { methods: HTTPMethod[] };

const onError = (error: unknown) => {
	logger.error(`API Error: ${(error as Error).message}`);
	return createJsonResponse(
		{ error: 'Something went wrong' },
		{
			status: 500,
		}
	);
};

const router = {
	'full-changelog.json': createEffectAPIRoutes(
		{
			POST: (ctx) =>
				ProcessChangelog.pipe(
					Effect.flatMap(({ generateChangelog, getRawChangelog, renderChangelog }) =>
						getRawChangelog().pipe(
							Effect.flatMap(generateChangelog),
							Effect.flatMap((changelogData) => renderChangelog(changelogData, ctx))
						)
					),
					Effect.map((renderedChangelog) => ({ success: true, changelog: renderedChangelog })),
					Effect.map(createJsonResponse),
					ProcessChangelog.Provide
				),
			OPTIONS: optionsFn(['POST']),
			ALL: allFn,
		},
		{
			cors: cors('POST'),
			onError,
		}
	),
	'list-pages': createEffectAPIRoutes(
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
			OPTIONS: optionsFn(['GET']),
			ALL: allFn,
		},
		{
			cors: cors('GET'),
			onError,
		}
	),
	'update-latest-version-cache': createEffectAPIRoutes(
		{
			GET: () =>
				SDKCore.pipe(
					Effect.flatMap((sdk) => sdk.UPDATE.latestVersion()),
					Effect.map((latestVersion) => createJsonResponse({ success: true, latestVersion }))
				),
			OPTIONS: optionsFn(['GET']),
			ALL: allFn,
		},
		{
			cors: cors('GET'),
			onError,
		}
	),
};

export const ALL = createSimplePathRouter('studiocms:sdk', router);
