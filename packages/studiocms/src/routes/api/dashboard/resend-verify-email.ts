import { VerifyEmail } from 'studiocms:auth/lib';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/resend-verify-email.POST')(function* () {
			const sdk = yield* SDKCore;
			const verifier = yield* VerifyEmail;

			// Check if mailer is enabled
			if (!context.locals.siteConfig.data.enableMailer) {
				return apiResponseLogger(400, 'Mailer is disabled, this action is disabled.');
			}

			const jsonData = yield* Effect.tryPromise(() => context.request.json());
			const { userId } = jsonData;

			if (!userId) {
				return apiResponseLogger(400, 'Invalid request');
			}

			const newToken = yield* sdk.AUTH.verifyEmail.create(userId);

			if (!newToken) {
				return apiResponseLogger(500, 'Failed to create verification token');
			}

			const response = yield* verifier.sendVerificationEmail(userId);

			if (!response) {
				return apiResponseLogger(500, 'Failed to send verification email');
			}

			if ('error' in response) {
				return apiResponseLogger(500, response.error);
			}

			return apiResponseLogger(200, response.message);
		}).pipe(VerifyEmail.Provide, SDKCore.Provide)
	);

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST',
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
			'Access-Control-Allow-Origin': '*',
		},
	});
};
