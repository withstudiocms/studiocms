import { VerifyEmail } from 'studiocms:auth/lib';
import { stripLeadingAndTrailingSlashes } from 'studiocms:lib';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '@withstudiocms/effect';

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

				const existingUser = yield* sdk.GET.users.byId(userId);

				if (!existingUser) {
					return apiResponseLogger(404, 'User not found');
				}

				yield* Effect.all([
					sdk.AUTH.user.update({
						userId,
						userData: {
							id: userId,
							name: existingUser.name,
							username: existingUser.username,
							emailVerified: true,
							updatedAt: new Date().toISOString(),
							createdAt: undefined,
						},
					}),
					sdk.AUTH.verifyEmail.delete(userId),
				]);

				if (!ctx.site) {
					return apiResponseLogger(400, 'Site URL is not configured');
				}
				return ctx.redirect(
					stripLeadingAndTrailingSlashes(ctx.site.toString()) +
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
