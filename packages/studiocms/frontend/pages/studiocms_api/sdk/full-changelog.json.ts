import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	OptionsResponse,
} from '@withstudiocms/effect';
import { ProcessChangelog } from './utils/changelog.js';

export const { ALL, OPTIONS, POST } = createEffectAPIRoutes(
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
);
