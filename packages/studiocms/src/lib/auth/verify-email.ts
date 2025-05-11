import { site } from 'astro:config/client';
import { StudioCMSRoutes } from 'studiocms:lib';
import { isMailerEnabled, sendMail } from 'studiocms:mailer';
import getTemplate from 'studiocms:mailer/templates';
import studioCMS_SDK from 'studiocms:sdk';
import type { CombinedUserData, tsEmailVerificationTokensSelect } from 'studiocms:sdk/types';
import { Effect, Layer } from 'effect';
import { CMSNotificationSettingsId } from '../../consts.js';
import type { MailerResponse } from '../mailer/index.js';
import type { UserSessionData } from './types.js';

export const make = Effect.gen(function* () {
	// TODO: Convert mailer functions into an Effect
	/**
	 * @private
	 */
	const getMailerStatus = () => Effect.tryPromise(() => isMailerEnabled());

	/**
	 * Retrieves the notification settings from the database.
	 * If the settings are not found, it returns a default settings object.
	 *
	 * @returns The notification settings.
	 */
	const getSettings = () =>
		Effect.gen(function* () {
			const settings = yield* Effect.tryPromise(() =>
				studioCMS_SDK.GET.databaseTable.notificationSettings()
			);

			if (!settings) {
				return {
					id: CMSNotificationSettingsId,
					emailVerification: false,
					requireAdminVerification: false,
					requireEditorVerification: false,
					oAuthBypassVerification: false,
				};
			}

			return settings;
		});

	/**
	 * Checks if email verification is enabled in the StudioCMS configuration.
	 *
	 * This function retrieves the notification settings from the database and
	 * returns the value of the `emailVerification` property. If the settings
	 * are not available, it defaults to `false`.
	 *
	 */
	const isEmailVerificationEnabled = () =>
		Effect.gen(function* () {
			const mailer = yield* getMailerStatus();
			const settings = yield* getSettings();
			if (!mailer) return false;
			return settings.emailVerification;
		});

	/**
	 * Retrieves an email verification request by its ID.
	 *
	 * @param id - The unique identifier of the email verification request.
	 * @returns A promise that resolves to the email verification request.
	 */
	const getEmailVerificationRequest = (id: string) =>
		Effect.tryPromise(() => studioCMS_SDK.AUTH.verifyEmail.get(id));

	/**
	 * Deletes an email verification request by its ID.
	 *
	 * @param id - The unique identifier of the email verification request to be deleted.
	 * @returns A promise that resolves when the email verification request is successfully deleted.
	 */
	const deleteEmailVerificationRequest = (id: string) =>
		Effect.tryPromise(() => studioCMS_SDK.AUTH.verifyEmail.delete(id));

	/**
	 * Creates an email verification request for a given user.
	 *
	 * This function first deletes any existing email verification requests for the user,
	 * and then creates a new email verification request using the studioCMS SDK.
	 *
	 * @param userId - The unique identifier of the user for whom the email verification request is being created.
	 * @returns A promise that resolves to the result of the email verification request creation.
	 */
	const createEmailVerificationRequest = (userId: string) =>
		Effect.gen(function* () {
			yield* deleteEmailVerificationRequest(userId);
			return yield* Effect.tryPromise(() => studioCMS_SDK.AUTH.verifyEmail.create(userId));
		});

	/**
	 * @private
	 */
	const generateUrl = (base: string, path: string, params?: Record<string, string>) =>
		Effect.try(() => {
			const url = new URL(path, base);
			for (const [key, value] of Object.entries(params || {})) {
				url.searchParams.append(key, value);
			}
			return url;
		});

	/**
	 * Sends a verification email to the user with the given userId.
	 *
	 * @param userId - The ID of the user to send the verification email to.
	 * @param isOAuth - Optional. Indicates if the user is authenticated via OAuth. Defaults to false.
	 *
	 * @returns A promise that resolves to the response of the mail sending operation.
	 *
	 * @throws Will throw an error if the user is not found, if the verification token creation fails, or if the user does not have an email.
	 */
	const sendVerificationEmail = (userId: string, isOAuth = false) =>
		Effect.gen(function* () {
			const mailer = yield* getMailerStatus();
			const settings = yield* getSettings();

			const [user, config] = yield* Effect.tryPromise(() =>
				Promise.all([
					studioCMS_SDK.GET.databaseEntry.users.byId(userId),
					studioCMS_SDK.GET.database.config(),
				])
			);

			if (!mailer || (isOAuth && settings.oAuthBypassVerification)) {
				return;
			}

			if (!user) {
				return yield* Effect.fail(new Error('User not found'));
			}

			const verificationToken = yield* createEmailVerificationRequest(userId);
			if (!verificationToken) {
				return yield* Effect.fail(new Error('Failed to create verification token'));
			}

			const email = user.email;
			if (!email) {
				return yield* Effect.fail(new Error('User does not have an email'));
			}

			const verifyLink = yield* generateUrl(
				site as string,
				StudioCMSRoutes.endpointLinks.verifyEmail,
				{ token: verificationToken.id, userId }
			);

			const htmlTemplate = getTemplate('verifyEmail');

			const mailResponse = yield* Effect.tryPromise(() =>
				sendMail({
					to: email,
					subject: `Email Verification | ${config?.title || 'StudioCMS'}`,
					html: htmlTemplate(verifyLink),
				})
			);

			return mailResponse;
		});

	/**
	 * Checks if the user's email is verified based on various conditions.
	 *
	 * @param user - The user data which includes email verification status and permissions.
	 * @returns A promise that resolves to a boolean indicating whether the user's email is verified.
	 *
	 * The function performs the following checks:
	 * 1. If the user is undefined, returns false.
	 * 2. If the mailer is not enabled, returns true.
	 * 3. If email verification is not required in settings, returns true.
	 * 4. If OAuth bypass verification is enabled and the user has OAuth data, returns true.
	 * 5. Based on the user's rank:
	 *    - 'owner': Always returns true.
	 *    - 'admin': Returns the user's email verification status if admin verification is required, otherwise returns true.
	 *    - 'editor': Returns the user's email verification status if editor verification is required, otherwise returns true.
	 *    - Default: Returns the user's email verification status.
	 */
	const isEmailVerified = (user: CombinedUserData | UserSessionData | undefined) =>
		Effect.gen(function* () {
			if (!user) return false;

			const mailer = yield* getMailerStatus();
			const settings = yield* getSettings();

			const {
				emailVerification,
				oAuthBypassVerification,
				requireAdminVerification,
				requireEditorVerification,
			} = settings;

			if (!mailer || !emailVerification) {
				return true;
			}

			let userToCheck: CombinedUserData | undefined = 'id' in user ? user : undefined;

			if ('user' in user) {
				const tUser = user.user;

				if (!tUser) {
					return false;
				}

				const possibleUser = yield* Effect.tryPromise(() =>
					studioCMS_SDK.GET.databaseEntry.users.byId(tUser.id)
				);

				if (!possibleUser) {
					return false;
				}

				userToCheck = possibleUser;
			}

			if ('id' in user) {
				userToCheck = user;
			}

			if (!userToCheck) {
				return false;
			}

			if (oAuthBypassVerification && userToCheck.oAuthData && userToCheck.oAuthData.length > 0) {
				return true;
			}

			switch (userToCheck.permissionsData?.rank) {
				case 'owner':
					return true;
				case 'admin': {
					if (requireAdminVerification) {
						return userToCheck.emailVerified;
					}
					return true;
				}
				case 'editor': {
					if (requireEditorVerification) {
						return userToCheck.emailVerified;
					}
					return true;
				}
				default:
					return userToCheck.emailVerified;
			}
		});

	return {
		isEmailVerificationEnabled,
		getEmailVerificationRequest,
		deleteEmailVerificationRequest,
		createEmailVerificationRequest,
		sendVerificationEmail,
		isEmailVerified,
	};
});

export class VerifyEmail extends Effect.Tag('studiocms/lib/auth/verify-email/VerifyEmail')<
	VerifyEmail,
	Effect.Effect.Success<typeof make>
>() {
	static Live = make;
	static Layer = Layer.scoped(this, this.Live);
}

/**
 * Checks if email verification is enabled in the StudioCMS configuration.
 *
 * This function retrieves the notification settings from the database and
 * returns the value of the `emailVerification` property. If the settings
 * are not available, it defaults to `false`.
 *
 * @returns {Promise<boolean>} A promise that resolves to `true` if email
 * verification is enabled, otherwise `false`.
 */
export async function isEmailVerificationEnabled(): Promise<boolean> {
	const program = Effect.gen(function* () {
		const verify = yield* VerifyEmail;
		return yield* verify.isEmailVerificationEnabled();
	}).pipe(Effect.provide(VerifyEmail.Layer));

	return await Effect.runPromise(program);
}

/**
 * Retrieves an email verification request by its ID.
 *
 * @param id - The unique identifier of the email verification request.
 * @returns A promise that resolves to the email verification request.
 */
export async function getEmailVerificationRequest(
	id: string
): Promise<tsEmailVerificationTokensSelect | null> {
	const program = Effect.gen(function* () {
		const verify = yield* VerifyEmail;
		return yield* verify.getEmailVerificationRequest(id);
	}).pipe(Effect.provide(VerifyEmail.Layer));

	return await Effect.runPromise(program);
}

/**
 * Deletes an email verification request by its ID.
 *
 * @param id - The unique identifier of the email verification request to be deleted.
 * @returns A promise that resolves when the email verification request is successfully deleted.
 */
export async function deleteEmailVerificationRequest(id: string): Promise<void> {
	const program = Effect.gen(function* () {
		const verify = yield* VerifyEmail;
		return yield* verify.deleteEmailVerificationRequest(id);
	}).pipe(Effect.provide(VerifyEmail.Layer));

	return await Effect.runPromise(program);
}

/**
 * Creates an email verification request for a given user.
 *
 * This function first deletes any existing email verification requests for the user,
 * and then creates a new email verification request using the studioCMS SDK.
 *
 * @param userId - The unique identifier of the user for whom the email verification request is being created.
 * @returns A promise that resolves to the result of the email verification request creation.
 */
export async function createEmailVerificationRequest(
	userId: string
): Promise<tsEmailVerificationTokensSelect> {
	const program = Effect.gen(function* () {
		const verify = yield* VerifyEmail;
		return yield* verify.createEmailVerificationRequest(userId);
	}).pipe(Effect.provide(VerifyEmail.Layer));

	return await Effect.runPromise(program);
}

/**
 * Sends a verification email to the user with the given userId.
 *
 * @param userId - The ID of the user to send the verification email to.
 * @param isOAuth - Optional. Indicates if the user is authenticated via OAuth. Defaults to false.
 *
 * @returns A promise that resolves to the response of the mail sending operation.
 *
 * @throws Will throw an error if the user is not found, if the verification token creation fails, or if the user does not have an email.
 */
export async function sendVerificationEmail(
	userId: string,
	isOAuth = false
): Promise<MailerResponse | undefined> {
	const program = Effect.gen(function* () {
		const verify = yield* VerifyEmail;
		return yield* verify.sendVerificationEmail(userId, isOAuth);
	}).pipe(Effect.provide(VerifyEmail.Layer));

	return await Effect.runPromise(program);
}

/**
 * Checks if the user's email is verified based on various conditions.
 *
 * @param user - The user data which includes email verification status and permissions.
 * @returns A promise that resolves to a boolean indicating whether the user's email is verified.
 *
 * The function performs the following checks:
 * 1. If the user is undefined, returns false.
 * 2. If the mailer is not enabled, returns true.
 * 3. If email verification is not required in settings, returns true.
 * 4. If OAuth bypass verification is enabled and the user has OAuth data, returns true.
 * 5. Based on the user's rank:
 *    - 'owner': Always returns true.
 *    - 'admin': Returns the user's email verification status if admin verification is required, otherwise returns true.
 *    - 'editor': Returns the user's email verification status if editor verification is required, otherwise returns true.
 *    - Default: Returns the user's email verification status.
 */
export async function isEmailVerified(
	user: CombinedUserData | UserSessionData | undefined
): Promise<boolean> {
	const program = Effect.gen(function* () {
		const verify = yield* VerifyEmail;
		return yield* verify.isEmailVerified(user);
	}).pipe(Effect.provide(VerifyEmail.Layer));

	return await Effect.runPromise(program);
}
