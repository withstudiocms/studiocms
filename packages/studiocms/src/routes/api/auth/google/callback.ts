import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';
import { GoogleOAuthAPI } from './effect.js';

export const GET: APIRoute = async (context: APIContext): Promise<Response> =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/auth/google/callback.GET')(function* () {
			const provider = yield* GoogleOAuthAPI;

			return yield* provider.initCallback(context);
		}).pipe(GoogleOAuthAPI.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();