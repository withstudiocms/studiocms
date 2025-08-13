import { User } from 'studiocms:auth/lib';
import { apiResponseLogger } from 'studiocms:logger';
import { Mailer } from 'studiocms:mailer';
import getTemplate from 'studiocms:mailer/templates';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';
import {
	AllResponse,
	appendSearchParamsToUrl,
	defineAPIRoute,
	Effect,
	genLogger,
	OptionsResponse,
	pipe,
} from '../../../effect.js';

type JSONData = {
	username: string | undefined;
	email: string | undefined;
	displayname: string | undefined;
	rank: 'owner' | 'admin' | 'editor' | 'visitor' | undefined;
	originalUrl: string;
};

type Token = {
	id: string;
	userId: string;
	token: string;
};

const generateResetUrl = (
	{
		locals: {
			StudioCMS: {
				routeMap: {
					mainLinks: { dashboardIndex },
				},
			},
		},
	}: APIContext,
	baseUrl: string,
	{ id, userId, token }: Token
) => {
	const resetURL = new URL(`${dashboardIndex}/password-reset`, baseUrl);
	return pipe(
		resetURL,
		appendSearchParamsToUrl('userid', userId),
		appendSearchParamsToUrl('token', token),
		appendSearchParamsToUrl('id', id)
	);
};

const noMailerError = (message: string, resetLink: URL) =>
	`Failed to send email: ${message}. You can provide the following Reset link to your User: ${resetLink}`;

export const POST: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/dashboard/create-user-invite.POST')(function* () {
			const userHelper = yield* User;
			const mailer = yield* Mailer;
			const notify = yield* Notifications;
			const sdk = yield* SDKCore;

			const siteConfig = ctx.locals.StudioCMS.siteConfig.data;

			if (!siteConfig) {
				return apiResponseLogger(500, 'Failed to get site config');
			}

			// Get user data
			const userData = ctx.locals.StudioCMS.security?.userSessionData;

			// Check if user is logged in
			if (!userData?.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isAdmin;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			const jsonData: JSONData = yield* Effect.tryPromise(() => ctx.request.json());

			const { username, email, displayname, rank, originalUrl } = jsonData;

			// If the username, password, email, or display name is missing, return an error
			if (!username) {
				return apiResponseLogger(400, 'Missing field: Username is required');
			}

			if (!email) {
				return apiResponseLogger(400, 'Missing field: Email is required');
			}

			if (!displayname) {
				return apiResponseLogger(400, 'Missing field: Display name is required');
			}

			if (!rank) {
				return apiResponseLogger(400, 'Missing field: Rank is required');
			}

			// If the username is invalid, return an error
			const verifyUsernameResponse = yield* userHelper.verifyUsernameInput(username);
			if (verifyUsernameResponse !== true) {
				return apiResponseLogger(400, verifyUsernameResponse);
			}

			// If the email is invalid, return an error
			const checkEmail = z.coerce
				.string()
				.email({ message: 'Email address is invalid' })
				.safeParse(email);

			if (!checkEmail.success) {
				return apiResponseLogger(400, `Invalid email: ${checkEmail.error.message}`);
			}

			const { usernameSearch, emailSearch } = yield* sdk.AUTH.user.searchUsersForUsernameOrEmail(
				username,
				checkEmail.data
			);

			if (usernameSearch.length > 0) {
				return apiResponseLogger(400, 'Invalid username: Username is already in use');
			}

			if (emailSearch.length > 0) {
				return apiResponseLogger(400, 'Invalid email: Email is already in use');
			}

			// Creates a new user invite
			const newUser = yield* sdk.AUTH.user.create(
				{
					username,
					email: checkEmail.data,
					name: displayname,
					createdAt: new Date(),
					id: crypto.randomUUID(),
				},
				rank
			);

			const token = yield* sdk.resetTokenBucket.new(newUser.id);

			if (!token) {
				return apiResponseLogger(500, 'Failed to create reset token');
			}

			const resetLink = generateResetUrl(ctx, originalUrl, token);

			yield* notify.sendAdminNotification('new_user', newUser.username);

			if (siteConfig.enableMailer) {
				const checkMailConnection = yield* mailer.verifyMailConnection;

				if (!checkMailConnection) {
					return apiResponseLogger(
						500,
						noMailerError('Failed to connect to mail server', resetLink)
					);
				}

				if ('error' in checkMailConnection) {
					return apiResponseLogger(
						500,
						noMailerError('Failed to connect to mail server', resetLink)
					);
				}

				const htmlTemplate = getTemplate('userInvite');

				const mailResponse = yield* mailer.sendMail({
					to: checkEmail.data,
					subject: `You have been invited to join ${siteConfig.title}!`,
					html: htmlTemplate({ title: siteConfig.title, link: resetLink }),
				});

				if (!mailResponse) {
					return apiResponseLogger(500, noMailerError('Failed to send email', resetLink));
				}

				if ('error' in mailResponse) {
					return apiResponseLogger(500, noMailerError(mailResponse.error, resetLink));
				}

				return apiResponseLogger(200, 'User invite created and email sent');
			}

			return apiResponseLogger(200, resetLink.toString());
		}).pipe(User.Provide, Mailer.Provide, Notifications.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse({ allowedMethods: ['POST'] });

export const ALL: APIRoute = async () => AllResponse();
