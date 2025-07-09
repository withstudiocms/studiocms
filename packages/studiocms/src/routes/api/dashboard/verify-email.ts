import { getEmailVerificationRequest } from 'studiocms:auth/lib/verify-email';
import { removeLeadingTrailingSlashes } from 'studiocms:lib';
import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
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

	const verificationToken = await getEmailVerificationRequest(userId);

	if (!verificationToken) {
		return apiResponseLogger(404, 'Verification token not found');
	}

	if (verificationToken.token !== token) {
		return apiResponseLogger(400, 'Invalid token');
	}

	// Update the user's email verification status
	await studioCMS_SDK.AUTH.user.update(userId, {
		// @ts-expect-error drizzle broke the variable...
		emailVerified: true,
	});

	// Delete the verification token
	await studioCMS_SDK.AUTH.verifyEmail.delete(userId);

	return context.redirect(
		removeLeadingTrailingSlashes(context.site?.toString() as string) +
			context.locals.routeMap.mainLinks.dashboardIndex
	);
};

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
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
