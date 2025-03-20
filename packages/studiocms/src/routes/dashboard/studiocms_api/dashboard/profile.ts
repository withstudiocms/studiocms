import { hashPassword, verifyPasswordStrength } from 'studiocms:auth/lib/password';
import {
	getUserData,
	verifyUserPermissionLevel,
	verifyUsernameInput,
} from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { sendAdminNotification, sendUserNotification } from 'studiocms:notifier';
import studioCMS_SDK from 'studiocms:sdk';
import type { tsUsersUpdate } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';

export const POST: APIRoute = async (context: APIContext): Promise<Response> => {
	// Check if demo mode is enabled
	if (developerConfig.demoMode !== false) {
		return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
	}

	// Get user data
	const userData = await getUserData(context);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'visitor');
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	type UserBasicUpdate = Omit<tsUsersUpdate, 'id'>;

	type UserPasswordUpdate = {
		currentPassword: string | null;
		newPassword: string;
		confirmNewPassword: string;
	};

	type UserProfileUpdate = {
		mode: 'basic' | 'password';
		data: UserBasicUpdate | UserPasswordUpdate;
	};

	// Get Json Data
	const userProfileUpdate: UserProfileUpdate = await context.request.json();

	// Validate form data
	if (userProfileUpdate.mode === 'basic') {
		const { data: r } = userProfileUpdate;

		const data = r as UserBasicUpdate;

		if (!data.name) {
			return apiResponseLogger(400, 'Invalid form data, name is required');
		}

		if (!data.email) {
			return apiResponseLogger(400, 'Invalid form data, email is required');
		}

		if (!data.username) {
			return apiResponseLogger(400, 'Invalid form data, username is required');
		}

		// If the username is invalid, return an error
		const verifyUsernameResponse = verifyUsernameInput(data.username);
		if (verifyUsernameResponse !== true) {
			return apiResponseLogger(400, verifyUsernameResponse);
		}

		// If the email is invalid, return an error
		const checkEmail = z.coerce
			.string()
			.email({ message: 'Email address is invalid' })
			.safeParse(data.email);

		if (!checkEmail.success)
			return apiResponseLogger(400, `Invalid email: ${checkEmail.error.message}`);

		const { usernameSearch, emailSearch } =
			await studioCMS_SDK.AUTH.user.searchUsersForUsernameOrEmail(data.username, checkEmail.data);

		if (userData.user?.username !== data.username) {
			if (usernameSearch.length > 0)
				return apiResponseLogger(400, 'Invalid username: Username is already in use');
		}
		if (userData.user?.email !== data.email) {
			if (emailSearch.length > 0)
				return apiResponseLogger(400, 'Invalid email: Email is already in use');
		}

		const toUpdate: tsUsersUpdate = {
			name: data.name,
			email: data.email,
			username: data.username,
		};

		try {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			await studioCMS_SDK.AUTH.user.update(userData.user!.id!, toUpdate);

			return apiResponseLogger(200, 'User profile updated successfully');
		} catch (error) {
			// Return Error Response
			return apiResponseLogger(500, 'Error updating user profile', error);
		}
	} else if (userProfileUpdate.mode === 'password') {
		const { data: r } = userProfileUpdate;

		const data = r as UserPasswordUpdate;

		const { currentPassword, newPassword, confirmNewPassword } = data;

		if (!currentPassword) {
			if (userData.user?.password) {
				return apiResponseLogger(400, 'Invalid form data, current password is required');
			}
		}

		if (!newPassword) {
			return apiResponseLogger(400, 'Invalid form data, new password is required');
		}

		if (!confirmNewPassword) {
			return apiResponseLogger(400, 'Invalid form data, confirm new password is required');
		}

		if (newPassword !== confirmNewPassword) {
			return apiResponseLogger(
				400,
				'Invalid form data, new password and confirm new password do not match'
			);
		}

		// If the password is invalid, return an error
		const verifyPasswordResponse = await verifyPasswordStrength(newPassword);
		if (verifyPasswordResponse !== true) {
			return apiResponseLogger(400, verifyPasswordResponse);
		}

		const userUpdate = {
			password: await hashPassword(newPassword),
		};

		try {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			await studioCMS_SDK.AUTH.user.update(userData.user!.id, userUpdate);

			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			await sendUserNotification('account_updated', userData.user!.id);
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			await sendAdminNotification('user_updated', userData.user!.username);

			return apiResponseLogger(200, 'User password updated successfully');
		} catch (error) {
			// Return Error Response
			return apiResponseLogger(500, 'Error updating user password');
		}
	}

	return apiResponseLogger(400, 'Invalid form data, mode is required');
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
