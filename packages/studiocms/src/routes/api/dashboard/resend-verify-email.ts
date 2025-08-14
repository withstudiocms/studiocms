import { VerifyEmail } from 'studiocms:auth/lib';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '../../../effect.js';

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/resend-verify-email.POST')(function* () {
				const [sdk, verifier] = yield* Effect.all([SDKCore, VerifyEmail]);

				// Check if mailer is enabled
				if (!ctx.locals.StudioCMS.siteConfig.data.enableMailer) {
					return apiResponseLogger(400, 'Mailer is disabled, this action is disabled.');
				}

				// Require authentication
				const userData = ctx.locals.StudioCMS.security?.userSessionData;
				if (!userData?.isLoggedIn) {
					return apiResponseLogger(403, 'Unauthorized');
				}
				// Restrict to admins/owners (or relax below to allow "self" requests only)
				const isPrivileged =
					ctx.locals.StudioCMS.security?.userPermissionLevel.isAdmin ||
					ctx.locals.StudioCMS.security?.userPermissionLevel.isOwner;
				if (!isPrivileged) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				const { userId } = yield* readAPIContextJson<{ userId: string }>(ctx);

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
			}).pipe(VerifyEmail.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse(
				{ error: 'Internal Server Error' },
				{
					status: 500,
				}
			);
		},
	}
);
