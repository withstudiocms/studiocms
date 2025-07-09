import { hashPassword, verifyPasswordStrength } from 'studiocms:auth/lib/password';
import { createUserAvatar, verifyUsernameInput } from 'studiocms:auth/lib/user';
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
	const userData = context.locals.userSessionData;

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	if (!context.locals.userPermissionLevel.isVisitor) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	type UserBasicUpdate = Omit<tsUsersUpdate, 'id'>;

	type UserPasswordUpdate = {
		currentPassword: string | null;
		newPassword: string;
		confirmNewPassword: string;
	};

	type BasicUserProfileUpdate = {
		mode: 'basic';
		data: UserBasicUpdate;
	};

	type PasswordProfileUpdate = {
		mode: 'password';
		data: UserPasswordUpdate;
	};

	type AvatarProfileUpdate = {
		mode: 'avatar';
	};

	type UserProfileUpdate = BasicUserProfileUpdate | PasswordProfileUpdate | AvatarProfileUpdate;

	// Get Json Data
	const userProfileUpdate: UserProfileUpdate = await context.request.json();

	// Validate form data
	if (userProfileUpdate.mode === 'basic') {
		const { data: r } = userProfileUpdate;

		const data = r;

		if (!data.name) {
			return apiResponseLogger(400, 'Invalid form data, name is required');
		}

		// @ts-expect-error drizzle broke the variable...
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
			// @ts-expect-error drizzle broke the variable...
			.safeParse(data.email);

		if (!checkEmail.success)
			return apiResponseLogger(400, `Invalid email: ${checkEmail.error.message}`);

		const { usernameSearch, emailSearch } =
			await studioCMS_SDK.AUTH.user.searchUsersForUsernameOrEmail(data.username, checkEmail.data);

		if (userData.user?.username !== data.username) {
			if (usernameSearch.length > 0)
				return apiResponseLogger(400, 'Invalid username: Username is already in use');
		}
		// @ts-expect-error drizzle broke the variable...
		if (userData.user?.email !== data.email) {
			if (emailSearch.length > 0)
				return apiResponseLogger(400, 'Invalid email: Email is already in use');
		}

		try {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			await studioCMS_SDK.AUTH.user.update(userData.user!.id!, data);

			return apiResponseLogger(200, 'User profile updated successfully');
		} catch (error) {
			// Return Error Response
			return apiResponseLogger(500, 'Error updating user profile', error);
		}
	} else if (userProfileUpdate.mode === 'password') {
		const { data: r } = userProfileUpdate;

		const data = r;

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
			// @ts-expect-error drizzle broke the variable...
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
	} else if (userProfileUpdate.mode === 'avatar') {
		if (!userData.user?.email) {
			return apiResponseLogger(400, 'User email required');
		}

		try {
			const newAvatar = await createUserAvatar(userData.user.email);

			// @ts-expect-error drizzle broke the variable...
			await studioCMS_SDK.AUTH.user.update(userData.user.id, { avatar: newAvatar });

			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			await sendUserNotification('account_updated', userData.user!.id);
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			await sendAdminNotification('user_updated', userData.user!.username);

			return apiResponseLogger(200, 'User Avatar updated successfully');
		} catch (error) {
			// Return Error Response
			return apiResponseLogger(500, 'Error updating user avatar');
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
