import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';
import { Auth0OAuthAPI } from './effect.js';

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/auth/auth0.GET')(function* () {
			const provider = yield* Auth0OAuthAPI;

			return yield* provider.initSession(context);
		}).pipe(Auth0OAuthAPI.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
