import { VerifyEmail } from 'studiocms:auth/lib';
import { removeLeadingTrailingSlashes } from 'studiocms:lib';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import { AllResponse, defineAPIRoute, genLogger, OptionsResponse } from '../../../effect.js';

export const GET: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/dashboard/verify-email.GET')(function* () {
			const verifyEmail = yield* VerifyEmail;
			const sdk = yield* SDKCore;

			// Check if mailer is enabled
			if (!ctx.locals.StudioCMS.siteConfig.data.enableMailer) {
				return apiResponseLogger(400, 'Mailer is disabled, this action is disabled.');
			}

			const url = new URL(ctx.request.url);
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

			return ctx.redirect(
				removeLeadingTrailingSlashes(ctx.site?.toString() as string) +
					ctx.locals.StudioCMS.routeMap.mainLinks.dashboardIndex
			);
		}).pipe(VerifyEmail.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['GET'] });

export const ALL: APIRoute = async () => AllResponse();
