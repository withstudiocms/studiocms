import { sendVerificationEmail } from 'studiocms:auth/lib/verify-email';
import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
	// Check if mailer is enabled
	if (!context.locals.siteConfig.data.enableMailer) {
		return apiResponseLogger(400, 'Mailer is disabled, this action is disabled.');
	}

	const jsonData = await context.request.json();
	const { userId } = jsonData;

	if (!userId) {
		return apiResponseLogger(400, 'Invalid request');
	}

	const newToken = await studioCMS_SDK.AUTH.verifyEmail.create(userId);

	if (!newToken) {
		return apiResponseLogger(500, 'Failed to create verification token');
	}

	const response = await sendVerificationEmail(userId);

	if (!response) {
		return apiResponseLogger(500, 'Failed to send verification email');
	}

	if ('error' in response) {
		return apiResponseLogger(500, response.error);
	}

	return apiResponseLogger(200, response.message);
};

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
