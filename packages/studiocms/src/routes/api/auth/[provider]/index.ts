import type { APIRoute } from 'astro';
import { AllResponse, defineAPIRoute, genLogger, OptionsResponse } from '../../../../effect.js';
import { OAuthAPIEffect } from './_effects/index.js';

export const GET: APIRoute = async (context) =>
	defineAPIRoute(context)((ctx) =>
		genLogger('studiocms/routes/api/auth/[provider]/index.GET')(function* () {
			const { initSession } = yield* OAuthAPIEffect;
			return yield* initSession(ctx);
		}).pipe(OAuthAPIEffect.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['GET'] });

export const ALL: APIRoute = async () => AllResponse();
