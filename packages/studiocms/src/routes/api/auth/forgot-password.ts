import { site } from 'astro:config/server';
import { developerConfig } from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import { apiResponseLogger } from 'studiocms:logger';
import { Mailer } from 'studiocms:mailer';
import getTemplate from 'studiocms:mailer/templates';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	appendSearchParamsToUrl,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	Layer,
	OptionsResponse,
	pipe,
} from '../../../effect.js';
import { AuthAPIUtils } from './shared.js';

/**
 * Generates a password reset link using the provided token and context.
 * The link is constructed using the main links from the route map and appending
 * the user ID, token, and token ID as search parameters.
 *
 * @param token - An object containing the token details (id, userId, token).
 * @param context - The API context containing the route map for generating the link.
 * @returns A URL object representing the password reset link.
 */
function generateResetLink(token: { id: string; userId: string; token: string }) {
	return pipe(
		new URL(StudioCMSRoutes.mainLinks.passwordReset, site),
		appendSearchParamsToUrl('userid', token.userId),
		appendSearchParamsToUrl('token', token.token),
		appendSearchParamsToUrl('id', token.id)
	);
}

const deps = Layer.mergeAll(Mailer.Default, Notifications.Default, AuthAPIUtils.Default);

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/auth/forgot-password/POST')(function* () {
				const [sdk, { sendMail }, { sendAdminNotification }, { readJson, validateEmail }] =
					yield* Effect.all([SDKCore, Mailer, Notifications, AuthAPIUtils]);

				// Check if demo mode is enabled
				if (developerConfig.demoMode !== false) {
					return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
				}

				// Check if the mailer is enabled
				const config = ctx.locals.StudioCMS.siteConfig.data;

				// If the mailer is not enabled, return an error
				if (!config.enableMailer) {
					return apiResponseLogger(500, 'Mailer is not enabled');
				}

				// Parse the request body as JSON
				const jsonData = yield* readJson(ctx);

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
				// If no user is found, return a generic success to avoid account enumeration
				if (emailSearch.length === 0) {
					return apiResponseLogger(
						200,
						'If an account exists for this email, a reset link has been sent.'
					);
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

				// Always return a generic success response
				return apiResponseLogger(
					200,
					'If an account exists for this email, a reset link has been sent.'
				);
			}).pipe(Effect.provide(deps)),
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
