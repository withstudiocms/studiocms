import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../../lib/endpointResponses.js';
import { GitHubOAuthAPI } from './effect.js';

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/auth/github.GET')(function* () {
			const provider = yield* GitHubOAuthAPI;

			return yield* provider.initSession(context);
		}).pipe(GitHubOAuthAPI.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
