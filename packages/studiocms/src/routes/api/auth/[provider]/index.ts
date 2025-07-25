import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../effect.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';
import { OAuthAPIEffect } from './_effects/index.js';

export const GET: APIRoute = async (context: APIContext) => {
	const authEnv = await OAuthAPIEffect.envChecker();
	return await convertToVanilla(
		genLogger('studiocms/routes/api/auth/[provider]/index.GET')(function* () {
			const { initSession } = yield* OAuthAPIEffect;
			return yield* initSession(context);
		}).pipe(OAuthAPIEffect.Provide, OAuthAPIEffect.AuthEnvResponse(authEnv))
	);
};

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
