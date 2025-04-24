import { site } from 'astro:config/client';
import { StudioCMSRoutes } from 'studiocms:lib';
import { isMailerEnabled, sendMail } from 'studiocms:mailer';
import getTemplate from 'studiocms:mailer/templates';
import studioCMS_SDK from 'studiocms:sdk';
import type {
	CombinedUserData,
	tsEmailVerificationTokensSelect,
	tsNotificationSettingsSelect,
} from 'studiocms:sdk/types';
import { CMSNotificationSettingsId } from '../../consts.js';
import type { MailerResponse } from '../mailer/index.js';
import type { UserSessionData } from './types.js';

/**
 * Retrieves the notification settings from the database.
 * If the settings are not found, it returns a default settings object.
 *
 * @returns {Promise<tsNotificationSettingsSelect>} The notification settings.
 */
async function getSettings(): Promise<tsNotificationSettingsSelect> {
	const settings = await studioCMS_SDK.GET.databaseTable.notificationSettings();
	if (!settings)
		return {
			id: CMSNotificationSettingsId,
			emailVerification: false,
			requireAdminVerification: false,
			requireEditorVerification: false,
			oAuthBypassVerification: false,
		};
	return settings;
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
	const [mailer, settings] = await Promise.all([isMailerEnabled(), getSettings()]);

	if (!mailer) return false;
	return settings.emailVerification;
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
	return await studioCMS_SDK.AUTH.verifyEmail.get(id);
}

/**
 * Deletes an email verification request by its ID.
 *
 * @param id - The unique identifier of the email verification request to be deleted.
 * @returns A promise that resolves when the email verification request is successfully deleted.
 */
export async function deleteEmailVerificationRequest(id: string): Promise<void> {
	return await studioCMS_SDK.AUTH.verifyEmail.delete(id);
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
	await deleteEmailVerificationRequest(userId);
	return await studioCMS_SDK.AUTH.verifyEmail.create(userId);
}

const generateUrl = (base: string, path: string, params?: Record<string, string>) => {
	const url = new URL(path, base);
	for (const [key, value] of Object.entries(params || {})) {
		url.searchParams.append(key, value);
	}
	return url;
};

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
	const [enableMailer, settings, user, config] = await Promise.all([
		isMailerEnabled(),
		getSettings(),
		studioCMS_SDK.GET.databaseEntry.users.byId(userId),
		studioCMS_SDK.GET.database.config(),
	]);

	if (!enableMailer || (isOAuth && settings.oAuthBypassVerification)) {
		return;
	}

	if (!user) {
		throw new Error('User not found');
	}

	const verificationToken = await createEmailVerificationRequest(userId);
	if (!verificationToken) {
		throw new Error('Failed to create verification token');
	}

	const email = user.email;
	if (!email) {
		throw new Error('User does not have an email');
	}

	const verifyLink = generateUrl(site as string, StudioCMSRoutes.endpointLinks.verifyEmail, {
		token: verificationToken.id,
		userId: userId,
	});

	const htmlTemplate = getTemplate('verifyEmail');

	const mailResponse = await sendMail({
		to: email,
		subject: `Email Verification | ${config?.title || 'StudioCMS'}`,
		html: htmlTemplate(verifyLink),
	});

	return mailResponse;
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
	if (!user) {
		return false;
	}

	const [enableMailer, settings] = await Promise.all([isMailerEnabled(), getSettings()]);

	const {
		emailVerification,
		oAuthBypassVerification,
		requireAdminVerification,
		requireEditorVerification,
	} = settings;

	if (!enableMailer || !emailVerification) {
		return true;
	}

	let userToCheck: CombinedUserData | undefined = 'id' in user ? user : undefined;

	if ('user' in user) {
		const tUser = user.user;

		if (!tUser) {
			return false;
		}

		const possibleUser = await studioCMS_SDK.GET.databaseEntry.users.byId(tUser.id);

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
}
