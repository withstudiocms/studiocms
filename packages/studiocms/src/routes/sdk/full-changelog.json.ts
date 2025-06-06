import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../lib/effects/index.js';
import { ProcessChangelog } from './utils/changelog.js';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('routes/sdk/full-changelog/POST')(function* () {
			const changeLogger = yield* ProcessChangelog;

			const rawChangelog = yield* changeLogger.getRawChangelog;

			const changelogData = yield* changeLogger.generateChangelog(rawChangelog);

			const renderedChangelog = yield* changeLogger.renderChangelog(changelogData, context);

			return new Response(JSON.stringify({ success: true, changelog: renderedChangelog }), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					Date: new Date().toUTCString(),
				},
			});
		}).pipe(ProcessChangelog.Provide)
	).catch((_error) => {
		return new Response(JSON.stringify({ success: false, error: 'Error fetching changelog' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				Date: new Date().toUTCString(),
			},
		});
	});

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
	});
};
