import { site } from 'astro:config/server';
import { developerConfig } from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import { apiResponseLogger } from 'studiocms:logger';
import { Mailer } from 'studiocms:mailer';
import getTemplate from 'studiocms:mailer/templates';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect, Layer } from 'effect';
import { dual, pipe } from 'effect/Function';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';
import { AuthAPIUtils } from './shared.js';

/**
 * Utility function to append search parameters to a URL.
 * This function can be used in a curried manner or with all arguments at once.
 *
 * @param args - Either a tuple of (URL, name, value) or a function that takes (name, value) and returns a function that takes a URL.
 * @returns A new URL with the search parameters appended.
 */
const appendSearchParams = dual<
	(name: string, value: string) => (url: URL) => URL,
	(url: URL, name: string, value: string) => URL
>(
	(args) => args.length === 3,
	(url, name, value) => {
		const newUrl = url;
		newUrl.searchParams.append(name, value);
		return newUrl;
	}
);

/**
 * Generates a password reset link using the provided token and context.
 * The link is constructed using the main links from the route map and appending
 * the user ID, token, and token ID as search parameters.
 *
 * @param token - An object containing the token details (id, userId, token).
 * @param context - The API context containing the route map for generating the link.
 * @returns A URL object representing the password reset link.
 */
function generateResetLink(token: {
	id: string;
	userId: string;
	token: string;
}) {
	return pipe(
		new URL(StudioCMSRoutes.mainLinks.passwordReset, site),
		appendSearchParams('userid', token.userId),
		appendSearchParams('token', token.token),
		appendSearchParams('id', token.id)
	);
}

const deps = Layer.mergeAll(
	Mailer.Default,
	Notifications.Default,
	AuthAPIUtils.Default
);

export const POST: APIRoute = async (context: APIContext): Promise<Response> =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/auth/forgot-password/POST')(function* () {
			const [sdk, { sendMail }, { sendAdminNotification }, { readJson, validateEmail }] =
				yield* Effect.all([SDKCore, Mailer, Notifications, AuthAPIUtils]);

			// Check if demo mode is enabled
			if (developerConfig.demoMode !== false) {
				return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
			}

			// Check if the mailer is enabled
			const config = context.locals.siteConfig.data;

			// If the mailer is not enabled, return an error
			if (!config.enableMailer) {
				return apiResponseLogger(500, 'Mailer is not enabled');
			}

			// Parse the request body as JSON
			const jsonData = yield* readJson(context);

			// Get the email from the JSON data
			const { email } = jsonData;

			// If the email is not provided, return an error
			if (!email) {
				return apiResponseLogger(400, 'Invalid form data, email is required');
			}

			// If the email is invalid, return an error
			const checkEmail = yield* validateEmail(email);

			if (!checkEmail.success) {
				return apiResponseLogger(400, checkEmail.error.message);
			}

			// Search for the user by email
			const { emailSearch } = yield* sdk.AUTH.user.searchUsersForUsernameOrEmail(
				'',
				checkEmail.data
			);

			// If no user is found, return an error
			if (emailSearch.length === 0) {
				return apiResponseLogger(404, 'User not found');
			}

			// Get the first user from the search results
			const user = emailSearch[0];

			// Create a new reset token for the user
			const token = yield* sdk.resetTokenBucket.new(user.id);

			// If the token could not be created, return an error
			if (!token) {
				return apiResponseLogger(500, 'Failed to create reset link');
			}

			// Send an admin notification that the user has been updated
			yield* sendAdminNotification('user_updated', user.username);

			// Generate the reset link using the token and context
			const resetLink = generateResetLink(token);

			// If the user does not have an email address, return an error
			// This should not happen, but we check it just in case
			// as the user may have been created without an email address
			// or the email address may have been removed
			// after the user was created.
			if (!user.email) {
				return apiResponseLogger(500, 'Failed to send email to user, no email address found');
			}

			// Get the HTML template for the password reset email
			const htmlTemplate = getTemplate('passwordReset');

			// Send the password reset email to the user
			const mailRes = yield* sendMail({
				to: user.email,
				subject: 'Password Reset',
				html: htmlTemplate(resetLink),
			});

			// If the email could not be sent, return an error
			if (!mailRes) {
				return apiResponseLogger(500, 'Failed to send email to user');
			}

			// If the email response contains an error, return the error
			if ('error' in mailRes) {
				return apiResponseLogger(500, `Failed to send email to user: ${mailRes.error}`);
			}

			// If everything is successful, return a success response
			return apiResponseLogger(200, 'Password reset link sent successfully');
		}).pipe(Effect.provide(deps))
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
