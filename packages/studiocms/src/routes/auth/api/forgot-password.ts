import { site } from 'astro:config/server';
import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { sendMail } from 'studiocms:mailer';
import getTemplate from 'studiocms:mailer/templates';
import { sendAdminNotification } from 'studiocms:notifier';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';

function generateResetLink(
	token: {
		id: string;
		userId: string;
		token: string;
	},
	context: APIContext
) {
	const url = new URL(context.locals.routeMap.mainLinks.passwordReset, site);
	url.searchParams.append('userid', token.userId);
	url.searchParams.append('token', token.token);
	url.searchParams.append('id', token.id);

	return url;
}

export const POST: APIRoute = async (context: APIContext) => {
	// Check if demo mode is enabled
	if (developerConfig.demoMode !== false) {
		return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
	}

	const config = context.locals.siteConfig.data;

	if (!config.enableMailer) {
		return apiResponseLogger(500, 'Mailer is not enabled');
	}

	const jsonData = await context.request.json();

	const { email } = jsonData;

	if (!email) {
		return apiResponseLogger(400, 'Invalid form data, email is required');
	}

	// If the email is invalid, return an error
	const checkEmail = z.coerce
		.string()
		.email({ message: 'Email address is invalid' })
		.safeParse(email);

	if (!checkEmail.success) {
		return apiResponseLogger(400, checkEmail.error.message);
	}

	const { emailSearch } = await studioCMS_SDK.AUTH.user.searchUsersForUsernameOrEmail(
		'',
		checkEmail.data
	);

	if (emailSearch.length === 0) {
		return apiResponseLogger(404, 'User not found');
	}

	const user = emailSearch[0];

	const token = await studioCMS_SDK.resetTokenBucket.new(user.id);

	if (!token) {
		return apiResponseLogger(500, 'Failed to create reset link');
	}

	await sendAdminNotification('user_updated', user.username);

	const resetLink = generateResetLink(token, context);

	if (!user.email) {
		return apiResponseLogger(500, 'Failed to send email to user, no email address found');
	}

	const htmlTemplate = getTemplate('passwordReset');

	const mailRes = await sendMail({
		to: user.email,
		subject: 'Password Reset',
		html: htmlTemplate(resetLink),
	});

	if (!mailRes) {
		return apiResponseLogger(500, 'Failed to send email to user');
	}

	if ('error' in mailRes) {
		return apiResponseLogger(500, `Failed to send email to user: ${mailRes.error}`);
	}

	return apiResponseLogger(200, 'Password reset link sent successfully');
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
