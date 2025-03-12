import { verifyPasswordStrength } from 'studiocms:auth/lib/password';
import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { sendAdminNotification, sendUserNotification } from 'studiocms:notifier';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';

const { testingAndDemoMode } = developerConfig;

export const POST: APIRoute = async (ctx: APIContext) => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		return apiResponseLogger(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	const jsonData = await ctx.request.json();

	const { token, id, userid, password, confirm_password } = jsonData;

	if (!token) {
		return apiResponseLogger(400, 'Invalid form data, token is required');
	}

	if (!id) {
		return apiResponseLogger(400, 'Invalid form data, id is required');
	}

	if (!userid) {
		return apiResponseLogger(400, 'Invalid form data, userid is required');
	}

	if (!password) {
		return apiResponseLogger(400, 'Invalid form data, password is required');
	}

	if (!confirm_password) {
		return apiResponseLogger(400, 'Invalid form data, confirm_password is required');
	}

	if (password !== confirm_password) {
		return apiResponseLogger(400, 'Passwords do not match');
	}

	if ((await verifyPasswordStrength(password)) !== true) {
		return apiResponseLogger(
			400,
			'Password must be between 6 and 255 characters, and not be in the <a href="https://haveibeenpwned.com/Passwords" target="_blank">pwned password database</a>.'
		);
	}

	const userUpdate = {
		password: password,
	};

	const userData = await studioCMS_SDK.GET.databaseEntry.users.byId(userid);

	if (!userData) {
		return apiResponseLogger(404, 'User not found');
	}

	try {
		await studioCMS_SDK.AUTH.user.update(userid, userUpdate);

		await studioCMS_SDK.resetTokenBucket.delete(userid);

		await sendUserNotification('account_updated', userid);
		await sendAdminNotification('user_updated', userData.username);

		return apiResponseLogger(200, 'User password updated successfully');
	} catch (error) {
		// Return Error Response
		return apiResponseLogger(500, 'Error updating user password', error);
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
