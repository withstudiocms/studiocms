import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../../../lib/effects/index.js';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:settings:GET')(function* () {
			const sdk = yield* SDKCore;
			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const siteConfig = yield* sdk.GET.siteConfig();

			return new Response(JSON.stringify(siteConfig), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}).pipe(SDKCore.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Error fetching site config', error);
	});

export const PATCH: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:settings:PATCH')(function* () {
			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const siteConfig = yield* Effect.tryPromise(() => context.request.json());

			if (!siteConfig.title) {
				return apiResponseLogger(400, 'Invalid form data, title is required');
			}

			if (!siteConfig.description) {
				return apiResponseLogger(400, 'Invalid form data, description is required');
			}

			if (!siteConfig.loginPageBackground) {
				return apiResponseLogger(400, 'Invalid form data, loginPageBackground is required');
			}

			if (siteConfig.loginPageBackground === 'custom' && !siteConfig.loginPageCustomImage) {
				return apiResponseLogger(400, 'Invalid form data, loginPageCustomImage is required');
			}

			const sdk = yield* SDKCore;

			yield* sdk.UPDATE.siteConfig(siteConfig);

			return apiResponseLogger(200, 'Site config updated');
		}).pipe(SDKCore.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Error updating site config', error);
	});

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, PATCH',
			'Access-Control-Allow-Origin': '*',
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
