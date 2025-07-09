import logger from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

const createJsonResponse = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			Date: new Date().toUTCString(),
		},
	});

export const GET: APIRoute = async (): Promise<Response> =>
	await convertToVanilla(
		genLogger('routes/sdk/update-latest-version-cache/GET')(function* () {
			logger.info('Updating latest version cache');
			const sdk = yield* SDKCore;
			const latestVersion = yield* sdk.UPDATE.latestVersion();
			logger.info('Latest version cache updated');
			return createJsonResponse({ success: true, latestVersion });
		}).pipe(SDKCore.Provide)
	).catch((error) => {
		logger.error(`Error updating latest version cache: ${error.message}`);
		return createJsonResponse(
			{
				success: false,
				error: `Error updating latest version cache: ${error.message}`,
			},
			500
		);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
