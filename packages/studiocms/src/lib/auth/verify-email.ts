// @ts-expect-error - Astro:config seems to only export a fake default export
import { site } from 'astro:config/client';
import { StudioCMSRoutes, removeLeadingTrailingSlashes } from 'studiocms:lib';
import { sendMail } from 'studiocms:mailer';
import studioCMS_SDK from 'studiocms:sdk';
import type { CombinedUserData } from 'studiocms:sdk/types';

export async function getEmailVerificationRequest(id: string) {
	return await studioCMS_SDK.AUTH.verifyEmail.get(id);
}

export async function deleteEmailVerificationRequest(id: string) {
	return await studioCMS_SDK.AUTH.verifyEmail.delete(id);
}

export async function createEmailVerificationRequest(userId: string) {
	await deleteEmailVerificationRequest(userId);
	return await studioCMS_SDK.AUTH.verifyEmail.create(userId);
}

export async function sendVerificationEmail(userId: string) {
	const user = await studioCMS_SDK.GET.databaseEntry.users.byId(userId);
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

	const mailResponse = await sendMail({
		to: email,
		subject: 'StudioCMS Email Verification',
		text: `Please verify your email by clicking the following link: ${
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			removeLeadingTrailingSlashes(site!)
		}${StudioCMSRoutes.endpointLinks.verifyEmail}?token=${verificationToken.id}&userId=${userId}`,
	});

	return mailResponse;
}

export async function isEmailVerified(user: CombinedUserData | undefined) {
	const { enableMailer } = (await studioCMS_SDK.GET.database.config()) || { enableMailer: false };

	if (!user) {
		return false;
	}

	if (!enableMailer) {
		return true;
	}

	const settings = (await studioCMS_SDK.GET.databaseTable.notificationSettings()) || {
		id: '1',
		emailVerification: false,
		requireAdminVerification: false,
		requireEditorVerification: false,
		oAuthBypassVerification: false,
	};

	const {
		emailVerification,
		oAuthBypassVerification,
		requireAdminVerification,
		requireEditorVerification,
	} = settings;

	if (!emailVerification) {
		return true;
	}

	if (oAuthBypassVerification && user.oAuthData && user.oAuthData.length > 0) {
		return true;
	}

	switch (user.permissionsData?.rank) {
		case 'owner':
			return true;
		case 'admin': {
			if (requireAdminVerification) {
				return user.emailVerified;
			}
			return true;
		}
		case 'editor': {
			if (requireEditorVerification) {
				return user.emailVerified;
			}
			return true;
		}
		default:
			return user.emailVerified;
	}
}
