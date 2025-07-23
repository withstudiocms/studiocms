import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../effect.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';
import { OAuthAPIEffect, authEnvChecker } from './_shared.js';

export const AuthEnv = async () => await convertToVanilla(authEnvChecker());

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/auth/[provider]/index.GET')(function* () {
			const { initSession } = yield* OAuthAPIEffect;
			return yield* initSession(context);
		}).pipe(OAuthAPIEffect.Deps, OAuthAPIEffect.AuthEnv(await AuthEnv()))
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
