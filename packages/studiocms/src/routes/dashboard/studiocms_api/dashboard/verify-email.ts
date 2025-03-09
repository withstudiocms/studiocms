import { getEmailVerificationRequest } from 'studiocms:auth/lib/verify-email';
import { developerConfig } from 'studiocms:config';
import { StudioCMSRoutes, removeLeadingTrailingSlashes } from 'studiocms:lib';
import { apiResponseLogger } from 'studiocms:logger';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIRoute } from 'astro';

const { testingAndDemoMode } = developerConfig;

const { enableMailer } = (await studioCMS_SDK.GET.database.config()) || { enableMailer: false };

export const GET: APIRoute = async (ctx) => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		return apiResponseLogger(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Check if mailer is enabled
	if (!enableMailer) {
		return apiResponseLogger(400, 'Mailer is disabled, this action is disabled.');
	}

	const params = new URLSearchParams(ctx.request.url);
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
		emailVerified: true,
	});

	// Delete the verification token
	await studioCMS_SDK.AUTH.verifyEmail.delete(userId);

	return ctx.redirect(
		removeLeadingTrailingSlashes(ctx.site?.toString() as string) +
			StudioCMSRoutes.mainLinks.dashboardIndex
	);
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET',
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
