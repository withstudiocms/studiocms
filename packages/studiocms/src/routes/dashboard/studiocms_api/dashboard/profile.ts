import { hashPassword, verifyPasswordStrength } from 'studiocms:auth/lib/password';
import {
	getUserData,
	verifyUserPermissionLevel,
	verifyUsernameInput,
} from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import studioCMS_SDK from 'studiocms:sdk';
import type { tsUsersUpdate } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import { simpleResponse } from '../../../../utils/simpleResponse.js';

const { testingAndDemoMode } = developerConfig;

export const POST: APIRoute = async (context: APIContext): Promise<Response> => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		return simpleResponse(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Get user data
	const userData = await getUserData(context);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return simpleResponse(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'visitor');
	if (!isAuthorized) {
		return simpleResponse(403, 'Unauthorized');
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
			return simpleResponse(400, 'Invalid form data, name is required');
		}

		if (!data.email) {
			return simpleResponse(400, 'Invalid form data, email is required');
		}

		if (!data.username) {
			return simpleResponse(400, 'Invalid form data, username is required');
		}

		if (verifyUsernameInput(data.username) !== true) {
			return simpleResponse(
				400,
				'Username must be between 3 and 20 characters, only contain lowercase letters, numbers, -, and _ as well as not be a commonly used username (admin, root, etc.)'
			);
		}

		// If the email is invalid, return an error
		const checkEmail = z.coerce
			.string()
			.email({ message: 'Email address is invalid' })
			.safeParse(data.email);

		if (!checkEmail.success)
			return simpleResponse(400, `Invalid email: ${checkEmail.error.message}`);

		const { usernameSearch, emailSearch } =
			await studioCMS_SDK.AUTH.user.searchUsersForUsernameOrEmail(data.username, checkEmail.data);

		if (userData.user?.username !== data.username) {
			if (usernameSearch.length > 0)
				return simpleResponse(400, 'Invalid username: Username is already in use');
		}
		if (userData.user?.email !== data.email) {
			if (emailSearch.length > 0)
				return simpleResponse(400, 'Invalid email: Email is already in use');
		}

		const toUpdate: tsUsersUpdate = {
			name: data.name,
			email: data.email,
			username: data.username,
		};

		try {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			await studioCMS_SDK.AUTH.user.update(userData.user!.id!, toUpdate);

			return simpleResponse(200, 'User profile updated successfully');
		} catch (error) {
			// Return Error Response
			return simpleResponse(500, 'Error updating user profile');
		}
	} else if (userProfileUpdate.mode === 'password') {
		const { data: r } = userProfileUpdate;

		const data = r as UserPasswordUpdate;

		const { currentPassword, newPassword, confirmNewPassword } = data;

		if (!currentPassword) {
			if (userData.user?.password) {
				return simpleResponse(400, 'Invalid form data, current password is required');
			}
		}

		if (!newPassword) {
			return simpleResponse(400, 'Invalid form data, new password is required');
		}

		if (!confirmNewPassword) {
			return simpleResponse(400, 'Invalid form data, confirm new password is required');
		}

		if (newPassword !== confirmNewPassword) {
			return simpleResponse(
				400,
				'Invalid form data, new password and confirm new password do not match'
			);
		}

		if ((await verifyPasswordStrength(newPassword)) !== true) {
			return simpleResponse(
				400,
				'Password must be between 6 and 255 characters, and not be in the <a href="https://haveibeenpwned.com/Passwords" target="_blank">pwned password database</a>.'
			);
		}

		const userUpdate = {
			password: await hashPassword(newPassword),
		};

		try {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			await studioCMS_SDK.AUTH.user.update(userData.user!.id, userUpdate);

			return simpleResponse(200, 'User password updated successfully');
		} catch (error) {
			// Return Error Response
			return simpleResponse(500, 'Error updating user password');
		}
	}

	return simpleResponse(400, 'Invalid form data, mode is required');
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
