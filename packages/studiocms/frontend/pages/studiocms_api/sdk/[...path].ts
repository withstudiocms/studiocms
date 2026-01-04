import logger from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	OptionsResponse,
} from '@withstudiocms/effect';
import { createSimplePathRouter } from '#frontend/utils/rest-router.js';
import { ProcessChangelog } from './utils/changelog.js';

const router = {
	'fallback-list-pages.json': createEffectAPIRoutes(
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
	),
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
			OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
			ALL: () => Effect.try(() => AllResponse()),
		},
		{
			cors: { methods: ['POST', 'OPTIONS'] },
			onError: (error) => {
				console.error('API Error:', error);
				return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
			},
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
	),
	'update-latest-version-cache.ts': createEffectAPIRoutes(
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
	),
};

export const ALL = createSimplePathRouter('studiocms:sdk', router);
