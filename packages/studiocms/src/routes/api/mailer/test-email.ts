import { apiResponseLogger } from 'studiocms:logger';
import { Mailer } from 'studiocms:mailer';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('routes/mailer/test-email/POST')(function* () {
			const mailer = yield* Mailer;

			// Check if mailer is enabled
			if (!context.locals.siteConfig.data.enableMailer) {
				return apiResponseLogger(400, 'Mailer is disabled, this action is disabled.');
			}

			// Check if user is logged in
			if (!context.locals.userSessionData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			if (!context.locals.userPermissionLevel.isOwner) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Get Json data
			const { test_email } = yield* Effect.tryPromise(() => context.request.json());

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
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
