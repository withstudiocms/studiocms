import {
	AllResponse,
	createEffectAPIRoutes,
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

				const rawChangelog = yield* changeLogger.getRawChangelog;

				const changelogData = yield* changeLogger.generateChangelog(rawChangelog);

				const renderedChangelog = yield* changeLogger.renderChangelog(changelogData, ctx);

				return new Response(JSON.stringify({ success: true, changelog: renderedChangelog }), {
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						Date: new Date().toUTCString(),
					},
				});
			}).pipe(ProcessChangelog.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return new Response(JSON.stringify({ error: 'Something went wrong' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		},
	}
);
