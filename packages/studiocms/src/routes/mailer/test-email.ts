import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { sendMail } from 'studiocms:mailer';
import studioCMS_cache from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';

const { testingAndDemoMode } = developerConfig;

const {
	data: { enableMailer },
} = await studioCMS_cache.GET.siteConfig();

export const POST: APIRoute = async (context: APIContext) => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		return apiResponseLogger(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Check if mailer is enabled
	if (!enableMailer) {
		return apiResponseLogger(400, 'Mailer is disabled, this action is disabled.');
	}

	// Get user data
	const userData = await getUserData(context);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'owner');
	if (!isAuthorized) {
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
