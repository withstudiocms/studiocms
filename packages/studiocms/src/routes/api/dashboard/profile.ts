import { Password, User } from 'studiocms:auth/lib';
import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { tsUsersUpdate } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

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

export const POST: APIRoute = async (context: APIContext): Promise<Response> => 
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/profile.POST')(function* () {
			const pass = yield* Password;
			const userHelper = yield* User;
			const notify = yield* Notifications;
			const sdk = yield* SDKCore;

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

			// Get Json Data
			const userProfileUpdate: UserProfileUpdate = yield* Effect.tryPromise(() =>
				context.request.json()
			);

			switch (userProfileUpdate.mode) {
				case 'basic': {
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
					const verifyUsernameResponse = yield* userHelper.verifyUsernameInput(data.username);
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
						yield* sdk.AUTH.user.searchUsersForUsernameOrEmail(data.username, checkEmail.data);

					if (userData.user?.username !== data.username) {
						if (usernameSearch.length > 0)
							return apiResponseLogger(400, 'Invalid username: Username is already in use');
					}
					// @ts-expect-error drizzle broke the variable...
					if (userData.user?.email !== data.email) {
						if (emailSearch.length > 0)
							return apiResponseLogger(400, 'Invalid email: Email is already in use');
					}
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
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

					// @ts-expect-error drizzle broke the variable...
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					yield* sdk.AUTH.user.update(userData.user!.id, userUpdate);

					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					yield* notify.sendUserNotification('account_updated', userData.user!.id);
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					yield* notify.sendAdminNotification('user_updated', userData.user!.username);

					return apiResponseLogger(200, 'User password updated successfully');
				}
				case 'avatar': {
					if (!userData.user?.email) {
						return apiResponseLogger(400, 'User email required');
					}
					const newAvatar = yield* userHelper.createUserAvatar(userData.user.email);

					// @ts-expect-error drizzle broke the variable...
					yield* sdk.AUTH.user.update(userData.user.id, { avatar: newAvatar });

					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					yield* notify.sendUserNotification('account_updated', userData.user!.id);
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					yield* notify.sendAdminNotification('user_updated', userData.user!.username);

					return apiResponseLogger(200, 'User Avatar updated successfully');
				}
				default:
					return apiResponseLogger(400, 'Invalid form data, mode is required or unsupported');
			}
		}).pipe(Password.Provide, User.Provide, Notifications.Provide, SDKCore.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
