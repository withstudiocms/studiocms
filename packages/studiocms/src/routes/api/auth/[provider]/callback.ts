import { AllResponse, defineAPIRoute, OptionsResponse } from '@withstudiocms/effect';
import type { APIRoute } from 'astro';
import { genLogger } from '../../../../effect.js';
import { OAuthAPIEffect } from './_effects/index.js';

export const GET: APIRoute = async (context) =>
	defineAPIRoute(context)((ctx) =>
		genLogger('studiocms/routes/api/auth/[provider]/callback.GET')(function* () {
			const { initCallback } = yield* OAuthAPIEffect;
			return yield* initCallback(ctx);
		}).pipe(OAuthAPIEffect.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['GET'] });

export const ALL: APIRoute = async () => AllResponse();
