import { logger } from '@it-astro:logger:studiocms-dashboard';
import { verifyPasswordStrength } from 'studiocms:auth/lib/password';
import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../utils/simpleResponse';

const { testingAndDemoMode } = developerConfig;

export const POST: APIRoute = async (ctx: APIContext) => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		logger.warn('Testing and demo mode is enabled, this action is disabled.');
		return simpleResponse(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Get user data
	const userData = await getUserData(ctx);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return simpleResponse(403, 'Unauthorized');
	}

	const jsonData = await ctx.request.json();

	const { token, id, userid, password, confirm_password } = jsonData;

	if (!token) {
		return new Response(JSON.stringify({ error: 'Invalid form data, token is required' }), {
			headers: {
				'content-type': 'application/json',
			},
			status: 400,
		});
	}

	if (!id) {
		return new Response(JSON.stringify({ error: 'Invalid form data, id is required' }), {
			headers: {
				'content-type': 'application/json',
			},
			status: 400,
		});
	}

	if (!userid) {
		return new Response(JSON.stringify({ error: 'Invalid form data, userid is required' }), {
			headers: {
				'content-type': 'application/json',
			},
			status: 400,
		});
	}

	if (!password) {
		return new Response(JSON.stringify({ error: 'Invalid form data, password is required' }), {
			headers: {
				'content-type': 'application/json',
			},
			status: 400,
		});
	}

	if (!confirm_password) {
		return new Response(
			JSON.stringify({ error: 'Invalid form data, confirm_password is required' }),
			{
				headers: {
					'content-type': 'application/json',
				},
				status: 400,
			}
		);
	}

	if (password !== confirm_password) {
		return new Response(JSON.stringify({ error: 'Passwords do not match' }), {
			headers: {
				'content-type': 'application/json',
			},
			status: 400,
		});
	}

	if ((await verifyPasswordStrength(password)) !== true) {
		return simpleResponse(
			400,
			'Password must be between 6 and 255 characters, and not be in the <a href="https://haveibeenpwned.com/Passwords" target="_blank">pwned password database</a>.'
		);
	}

	const userUpdate = {
		password: password,
	};

	try {
		await studioCMS_SDK.AUTH.user.update(userid, userUpdate);

		await studioCMS_SDK.resetTokenBucket.delete(userid);

		logger.info('User password updated');

		return simpleResponse(200, 'User password updated successfully');
	} catch (error) {
		// Log error
		if (error instanceof Error) {
			logger.error(error.message);
		}
		// Return Error Response
		return simpleResponse(500, 'Error updating user password');
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
