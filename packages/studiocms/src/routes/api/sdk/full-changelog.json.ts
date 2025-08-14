import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';
import { ProcessChangelog } from './utils/changelog.js';

export const { ALL, OPTIONS, POST } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('routes/sdk/full-changelog/POST')(function* () {
				const changeLogger = yield* ProcessChangelog;

				const rawChangelog = yield* changeLogger.getRawChangelog();

				const changelogData = yield* changeLogger.generateChangelog(rawChangelog);

				const renderedChangelog = yield* changeLogger.renderChangelog(changelogData, ctx);

				return createJsonResponse({ success: true, changelog: renderedChangelog });
			}).pipe(ProcessChangelog.Provide),
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
