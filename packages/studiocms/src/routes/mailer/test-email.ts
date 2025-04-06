import { apiResponseLogger } from 'studiocms:logger';
import { sendMail } from 'studiocms:mailer';
import type { APIContext, APIRoute } from 'astro';

export const POST: APIRoute = async (context: APIContext) => {
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

	// Get Json Data
	const { test_email } = await context.request.json();

	// Validate form data
	if (!test_email && typeof test_email !== 'string') {
		return apiResponseLogger(400, 'Invalid form data, test_email is required');
	}

	// Send Test Email
	try {
		const response = await sendMail({
			to: test_email,
			subject: 'StudioCMS Test Email',
			text: 'This is a test email from StudioCMS.',
		});

		if ('error' in response) {
			return apiResponseLogger(500, response.error);
		}

		return apiResponseLogger(200, response.message);
	} catch (error) {
		return apiResponseLogger(500, 'Error sending test email');
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST',
			'ALLOW-ACCESS-CONTROL-ORIGIN': '*',
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
