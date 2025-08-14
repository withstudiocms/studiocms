import { apiResponseLogger } from 'studiocms:logger';
import { Mailer } from 'studiocms:mailer';
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
			genLogger('routes/mailer/test-email/POST')(function* () {
				const mailer = yield* Mailer;

				// Check if mailer is enabled
				if (!ctx.locals.StudioCMS.siteConfig.data.enableMailer) {
					return apiResponseLogger(400, 'Mailer is disabled, this action is disabled.');
				}

				// Check if user is logged in
				if (!ctx.locals.StudioCMS.security?.userSessionData.isLoggedIn) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Check if user has permission
				if (!ctx.locals.StudioCMS.security?.userPermissionLevel.isOwner) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Get Json data
				const { test_email } = yield* readAPIContextJson<{ test_email: string }>(ctx);

				// Validate form data
				if (!test_email || typeof test_email !== 'string') {
					return apiResponseLogger(400, 'Invalid form data, test_email is required');
				}

				// Send Test Email
				const response = yield* mailer.sendMail({
					to: test_email,
					subject: 'StudioCMS Test Email',
					text: 'This is a test email from StudioCMS.',
				});

				if ('error' in response) {
					console.error('Mailer test-email failed:', response.error);
					return apiResponseLogger(500, 'Failed to send test email');
				}
				return apiResponseLogger(200, 'Test email sent');
			}).pipe(Mailer.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
