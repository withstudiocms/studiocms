import { VerifyEmail } from 'studiocms:auth/lib';
import { removeLeadingTrailingSlashes } from 'studiocms:lib';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

export const { GET, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/verify-email.GET')(function* () {
				const [sdk, verifyEmail] = yield* Effect.all([SDKCore, VerifyEmail]);

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

				yield* Effect.all([
					sdk.AUTH.user.update(userId, {
						emailVerified: true,
					}),
					sdk.AUTH.verifyEmail.delete(userId),
				]);

				return ctx.redirect(
					removeLeadingTrailingSlashes(ctx.site?.toString() as string) +
						ctx.locals.StudioCMS.routeMap.mainLinks.dashboardIndex
				);
			}).pipe(VerifyEmail.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
