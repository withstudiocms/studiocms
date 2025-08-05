import { VerifyEmail } from 'studiocms:auth/lib';
import { removeLeadingTrailingSlashes } from 'studiocms:lib';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/verify-email.GET')(function* () {
			const verifyEmail = yield* VerifyEmail;
			const sdk = yield* SDKCore;

			// Check if mailer is enabled
			if (!context.locals.siteConfig.data.enableMailer) {
				return apiResponseLogger(400, 'Mailer is disabled, this action is disabled.');
			}

			const url = new URL(context.request.url);
			const params = url.searchParams;
			const token = params.get('token');
			const userId = params.get('userId');

			if (!token || !userId) {
				return apiResponseLogger(400, 'Invalid request');
			}

			const verificationToken = yield* verifyEmail.getEmailVerificationRequest(userId);

			if (!verificationToken) {
				return apiResponseLogger(404, 'Verification token not found');
			}

			if (verificationToken.token !== token) {
				return apiResponseLogger(400, 'Invalid token');
			}

			yield* sdk.AUTH.user.update(userId, {
				emailVerified: true,
			});

			yield* sdk.AUTH.verifyEmail.delete(userId);

			return context.redirect(
				removeLeadingTrailingSlashes(context.site?.toString() as string) +
					context.locals.routeMap.mainLinks.dashboardIndex
			);
		}).pipe(VerifyEmail.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET']);

export const ALL: APIRoute = async () => AllResponse();
