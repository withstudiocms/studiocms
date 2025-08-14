/** biome-ignore-all lint/style/noNonNullAssertion: This file uses valid use cases for non-null assertion */
import { Password, User } from 'studiocms:auth/lib';
import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { tsUsersUpdate } from 'studiocms:sdk/types';
import { z } from 'astro/zod';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '../../../effect.js';

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

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/profile.POST')(function* () {
				const [pass, userHelper, notify, sdk] = yield* Effect.all([
					Password,
					User,
					Notifications,
					SDKCore,
				]);

				// Check if demo mode is enabled
				if (developerConfig.demoMode !== false) {
					return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
				}

				// Get user data
				const userData = ctx.locals.StudioCMS.security?.userSessionData;

				// Check if user is logged in
				if (!userData?.isLoggedIn) {
					return apiResponseLogger(401, 'Unauthorized');
				}

				// Check if user has permission
				if (!ctx.locals.StudioCMS.security?.userPermissionLevel.isVisitor) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// Get Json Data
				const userProfileUpdate = yield* readAPIContextJson<UserProfileUpdate>(ctx);

				switch (userProfileUpdate.mode) {
					case 'basic': {
						const { data: r } = userProfileUpdate;

						const data = r;

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
						const verifyUsernameResponse = yield* userHelper.verifyUsernameInput(data.username);
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
							yield* sdk.AUTH.user.searchUsersForUsernameOrEmail(data.username, checkEmail.data);

						if (userData.user?.username !== data.username) {
							if (usernameSearch.length > 0)
								return apiResponseLogger(400, 'Invalid username: Username is already in use');
						}
						if (userData.user?.email !== data.email) {
							if (emailSearch.length > 0)
								return apiResponseLogger(400, 'Invalid email: Email is already in use');
						}
						yield* sdk.AUTH.user.update(userData.user!.id!, data);

						return apiResponseLogger(200, 'User profile updated successfully');
					}
					case 'password': {
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

						// Verify the current password matches the stored hash (when one exists)
						if (currentPassword && userData.user?.password) {
							const isValid = yield* pass.verifyPasswordHash(
								userData.user.password,
								currentPassword
							);
							if (!isValid) {
								return apiResponseLogger(400, 'Invalid current password');
							}
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
						const verifyPasswordResponse = yield* pass.verifyPasswordStrength(newPassword);
						if (verifyPasswordResponse !== true) {
							return apiResponseLogger(400, verifyPasswordResponse);
						}

						const userUpdate = {
							password: yield* pass.hashPassword(newPassword),
						};

						if (userData.user)
							yield* Effect.all([
								sdk.AUTH.user.update(userData.user.id, userUpdate),
								notify.sendUserNotification('account_updated', userData.user.id),
								notify.sendAdminNotification('user_updated', userData.user.username),
							]);

						return apiResponseLogger(200, 'User password updated successfully');
					}
					case 'avatar': {
						if (!userData.user?.email) {
							return apiResponseLogger(400, 'User email required');
						}

						if (userData.user)
							yield* userHelper
								.createUserAvatar(userData.user.email)
								.pipe(
									Effect.flatMap((newAvatar) =>
										Effect.all([
											sdk.AUTH.user.update(userData.user!.id, { avatar: newAvatar }),
											notify.sendUserNotification('account_updated', userData.user!.id),
											notify.sendAdminNotification('user_updated', userData.user!.username),
										])
									)
								);

						return apiResponseLogger(200, 'User Avatar updated successfully');
					}
					default:
						return apiResponseLogger(400, 'Invalid form data, mode is required or unsupported');
				}
			}).pipe(Password.Provide, User.Provide, Notifications.Provide),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse(
				{ error: 'Internal Server Error' },
				{
					status: 500,
				}
			);
		},
	}
);
