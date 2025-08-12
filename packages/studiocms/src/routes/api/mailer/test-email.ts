import { apiResponseLogger } from 'studiocms:logger';
import { Mailer } from 'studiocms:mailer';
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
			const { test_email } = yield* Effect.tryPromise(() => ctx.request.json());

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
				return apiResponseLogger(500, response.error);
			}
			return apiResponseLogger(200, response.message);
		}).pipe(Mailer.Provide)
	).catch((error) => {
		return apiResponseLogger(500, `Error sending test email: ${error.message}`);
	});

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['POST'] });

export const ALL: APIRoute = async () => AllResponse();
