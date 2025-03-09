import AstroConfig from 'astro:config/client';
import { StudioCMSRoutes, removeLeadingTrailingSlashes } from 'studiocms:lib';
import { sendMail } from 'studiocms:mailer';
import studioCMS_SDK from 'studiocms:sdk';

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
			removeLeadingTrailingSlashes(AstroConfig.site!)
		}${StudioCMSRoutes.endpointLinks.verifyEmail}?token=${verificationToken.id}&userId=${userId}`,
	});

	return mailResponse;
}
