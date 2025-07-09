import { VerifyEmail } from 'studiocms:auth/lib';
import { removeLeadingTrailingSlashes } from 'studiocms:lib';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/verify-email.GET')(function* () {
			const verifyEmail = yield* VerifyEmail;
			const sdk = yield* SDKCore;

			// Check if mailer is enabled
			if (!context.locals.siteConfig.data.enableMailer) {
				return apiResponseLogger(400, 'Mailer is disabled, this action is disabled.');
			}

			const params = new URLSearchParams(context.request.url);
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
				// @ts-expect-error drizzle broke the variable...
				emailVerified: true,
			});

			yield* sdk.AUTH.verifyEmail.delete(userId);

			return context.redirect(
				removeLeadingTrailingSlashes(context.site?.toString() as string) +
					context.locals.routeMap.mainLinks.dashboardIndex
			);
		}).pipe(VerifyEmail.Provide, SDKCore.Provide)
	);

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET',
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
