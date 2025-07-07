import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../lib/effects/index.js';
import { DiscordOAuthAPI } from './effect.js';

export const GET: APIRoute = async (context: APIContext): Promise<Response> => 
	await convertToVanilla(
		genLogger('studiocms/routes/auth/api/discord/callback.GET')(function* () {
			const provider = yield* DiscordOAuthAPI;

			return yield* provider.initCallback(context);
		}).pipe(DiscordOAuthAPI.Provide)
	);

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET',
			'ALLOW-ACCESS-CONTROL-ORIGIN': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
