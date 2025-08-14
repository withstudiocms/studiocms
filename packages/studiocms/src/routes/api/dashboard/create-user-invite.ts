import { User } from 'studiocms:auth/lib';
import { apiResponseLogger } from 'studiocms:logger';
import { Mailer } from 'studiocms:mailer';
import getTemplate from 'studiocms:mailer/templates';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext } from 'astro';
import { z } from 'astro/zod';
import {
	AllResponse,
	appendSearchParamsToUrl,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	pipe,
	readAPIContextJson,
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

export const { POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms/routes/api/dashboard/create-user-invite.POST')(function* () {
				const [userHelper, mailer, notify, sdk] = yield* Effect.all([
					User,
					Mailer,
					Notifications,
					SDKCore,
				]);

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

				const { username, email, displayname, rank, originalUrl } =
					yield* readAPIContextJson<JSONData>(ctx);

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

				const userPerms = ctx.locals.StudioCMS.security?.userPermissionLevel;
				if (rank === 'owner' && !userPerms?.isOwner) {
					return apiResponseLogger(403, 'Unauthorized');
				}

				// If the email is invalid, return an error
				const checkEmail = z.coerce
					.string()
					.email({ message: 'Email address is invalid' })
					.safeParse(email);

				if (!checkEmail.success) {
					return apiResponseLogger(400, `Invalid email: ${checkEmail.error.message}`);
				}

				const [verifyUsernameResponse, { usernameSearch, emailSearch }] = yield* Effect.all([
					userHelper.verifyUsernameInput(username),
					sdk.AUTH.user.searchUsersForUsernameOrEmail(username, checkEmail.data),
				]);

				if (verifyUsernameResponse !== true) {
					return apiResponseLogger(400, verifyUsernameResponse);
				}

				if (usernameSearch.length > 0) {
					return apiResponseLogger(400, 'Invalid username: Username is already in use');
				}

				if (emailSearch.length > 0) {
					return apiResponseLogger(400, 'Invalid email: Email is already in use');
				}

				// Creates a new user invite
				const token = yield* sdk.AUTH.user
					.create(
						{
							username,
							email: checkEmail.data,
							name: displayname,
							createdAt: new Date(),
							id: crypto.randomUUID(),
						},
						rank
					)
					.pipe(Effect.flatMap((newUser) => sdk.resetTokenBucket.new(newUser.id)));

				if (!token) {
					return apiResponseLogger(500, 'Failed to create reset token');
				}

				const resetLink = generateResetUrl(ctx, originalUrl, token);

				yield* notify.sendAdminNotification('new_user', username);

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
			}).pipe(User.Provide, Mailer.Provide, Notifications.Provide),
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
