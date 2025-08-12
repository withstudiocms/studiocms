import { VerifyEmail } from 'studiocms:auth/lib';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

export const POST: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/dashboard/resend-verify-email.POST')(function* () {
			const sdk = yield* SDKCore;
			const verifier = yield* VerifyEmail;

			// Check if mailer is enabled
			if (!ctx.locals.StudioCMS.siteConfig.data.enableMailer) {
				return apiResponseLogger(400, 'Mailer is disabled, this action is disabled.');
			}

			const jsonData = yield* Effect.tryPromise(() => ctx.request.json());
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
		}).pipe(VerifyEmail.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['POST'] });

export const ALL: APIRoute = async () => AllResponse();
