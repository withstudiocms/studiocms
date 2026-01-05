import { site } from 'astro:config/server';
import { Password, Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { authConfig, developerConfig } from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import { apiResponseLogger } from 'studiocms:logger';
import { Mailer } from 'studiocms:mailer';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import templateEngine from 'studiocms:template-engine';
import {
	AllResponse,
	appendSearchParamsToUrl,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	type HTTPMethod,
	Layer,
	OptionsResponse,
	pipe,
	pipeLogger,
} from '@withstudiocms/effect';
import { AuthSessionCookieName } from '#consts';
import { createSimplePathRouter } from '#frontend/utils/rest-router.js';
import { AuthAPIUtils } from './_shared';

const loginRegisterDependencies = Layer.mergeAll(AuthAPIUtils.Default, VerifyEmail.Default);
const forgotPasswordDependencies = Layer.mergeAll(
	Mailer.Default,
	Notifications.Default,
	AuthAPIUtils.Default
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
function generateResetLink(token: { id: string; userId: string; token: string }) {
	return pipe(
		new URL(StudioCMSRoutes.mainLinks.passwordReset, site),
		appendSearchParamsToUrl('userid', token.userId),
		appendSearchParamsToUrl('token', token.token),
		appendSearchParamsToUrl('id', token.id)
	);
}

const usernameAndPasswordRoutesEnabled =
	authConfig.enabled && authConfig.providers.usernameAndPassword;
const userRegistrationEnabled =
	authConfig.enabled && authConfig.providers.usernameAndPasswordConfig.allowUserRegistration;

const onError = (error: unknown) => {
	const errorDetails = error instanceof Error ? error.message : String(error);
	console.error('API Error:', errorDetails);
	return createJsonResponse(
		{ error: 'Internal Server Error' },
		{
			status: 500,
		}
	);
};

const sharedHandlers = {
	OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
	ALL: () => Effect.try(() => AllResponse()),
};

const cors: {
	methods: HTTPMethod[];
} = {
	methods: ['POST', 'OPTIONS'],
};

const router = {
	'forgot-password': createEffectAPIRoutes(
		{
			POST: (ctx) =>
				genLogger('studiocms/routes/api/auth/forgot-password/POST')(function* () {
					const [sdk, { sendMail }, { sendAdminNotification }, { readJson, validateEmail }] =
						yield* Effect.all([SDKCore, Mailer, Notifications, AuthAPIUtils]);

					if (!usernameAndPasswordRoutesEnabled) {
						return apiResponseLogger(403, 'Username and password routes are disabled.');
					}

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
					const engine = yield* templateEngine;
					const { title: siteTitle, description, siteIcon } = config;

					const passwordResetTemplate = yield* engine.render('passwordReset', {
						site: { title: siteTitle, description, icon: siteIcon ?? undefined },
						data: { link: resetLink.toString() },
					});

					// Send the password reset email to the user
					const mailRes = yield* sendMail({
						to: user.email,
						subject: 'Password Reset',
						html: passwordResetTemplate,
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
				}).pipe(Effect.provide(forgotPasswordDependencies)),
			...sharedHandlers,
		},
		{
			cors,
			onError,
		}
	),
	login: createEffectAPIRoutes(
		{
			POST: (ctx) =>
				genLogger('studiocms/routes/api/auth/login/POST')(function* () {
					const [
						sdk,
						{ badFormDataEntry, parseFormDataEntryToString, readFormData },
						{ verifyPasswordHash },
						{ createUserSession },
						{ isEmailVerified },
					] = yield* Effect.all([SDKCore, AuthAPIUtils, Password, Session, VerifyEmail]);

					if (!usernameAndPasswordRoutesEnabled) {
						return apiResponseLogger(403, 'Username and password routes are disabled.');
					}

					const formData = yield* readFormData(ctx);

					const [username, password] = yield* pipeLogger(
						'studiocms/routes/api/auth/login/POST.parseFormData'
					)(
						Effect.all([
							parseFormDataEntryToString(formData, 'username'),
							parseFormDataEntryToString(formData, 'password'),
						])
					);

					if (!username)
						return yield* badFormDataEntry('Invalid credentials', 'Invalid credentials');
					if (!password)
						return yield* badFormDataEntry('Invalid credentials', 'Invalid credentials');

					const existingUser = yield* sdk.GET.users.byUsername(username);

					// If the user does not exist, return an ambiguous error
					if (!existingUser)
						return yield* badFormDataEntry('Invalid credentials', 'Invalid credentials');

					// Check if the user has a password or is using a oAuth login
					if (!existingUser.password)
						return yield* badFormDataEntry('Invalid credentials', 'Invalid credentials');

					const validPassword = yield* verifyPasswordHash(existingUser.password, password);

					if (!validPassword)
						return yield* badFormDataEntry('Invalid credentials', 'Invalid credentials');

					const isEmailAccountVerified = yield* isEmailVerified(existingUser);

					// If the email is not verified, return an error
					if (!isEmailAccountVerified)
						return yield* badFormDataEntry(
							'Email not verified',
							'Please verify your email before logging in'
						);

					yield* createUserSession(existingUser.id, ctx);

					return new Response();
				}).pipe(Effect.provide(loginRegisterDependencies)),
			...sharedHandlers,
		},
		{
			cors,
			onError,
		}
	),
	logout: createEffectAPIRoutes(
		{
			POST: (ctx) =>
				genLogger('studiocms/routes/api/auth/logout/POST')(function* () {
					const { validateSessionToken, deleteSessionTokenCookie, invalidateSession } =
						yield* Session;

					const { cookies, redirect } = ctx;

					const sessionToken = cookies.get(AuthSessionCookieName)?.value ?? null;

					if (!sessionToken) return redirect(StudioCMSRoutes.authLinks.loginURL);

					const { session, user } = yield* validateSessionToken(sessionToken);

					// If there is no session, redirect to the login page
					if (session === null) {
						yield* deleteSessionTokenCookie(ctx);
						return redirect(StudioCMSRoutes.authLinks.loginURL);
					}

					// If there is no user, delete cookie and redirect to the login page
					if (!user || user === null) {
						yield* deleteSessionTokenCookie(ctx);
						return redirect(StudioCMSRoutes.authLinks.loginURL);
					}

					// Invalidate the session and delete the session token cookie
					yield* Effect.all([invalidateSession(session.id), deleteSessionTokenCookie(ctx)]);

					return redirect(StudioCMSRoutes.mainLinks.baseSiteURL);
				}),
			...sharedHandlers,
		},
		{
			cors,
			onError,
		}
	),
	register: createEffectAPIRoutes(
		{
			POST: (ctx) =>
				genLogger('studiocms/routes/api/auth/register/POST')(function* () {
					const [
						sdk,
						{ badFormDataEntry, parseFormDataEntryToString, readFormData, validateEmail },
						{ verifyUsernameInput, createLocalUser },
						{ sendVerificationEmail },
						{ verifyPasswordStrength },
						{ createUserSession },
					] = yield* Effect.all([SDKCore, AuthAPIUtils, User, VerifyEmail, Password, Session]);

					if (!userRegistrationEnabled) {
						return apiResponseLogger(403, 'User registration is disabled.');
					}

					const formData = yield* readFormData(ctx);

					const [username, password, email, name] = yield* pipeLogger(
						'studiocms/routes/api/auth/register/POST.parseFormData'
					)(
						Effect.all([
							parseFormDataEntryToString(formData, 'username'),
							parseFormDataEntryToString(formData, 'password'),
							parseFormDataEntryToString(formData, 'email'),
							parseFormDataEntryToString(formData, 'displayname'),
						])
					);

					if (!username) return yield* badFormDataEntry('MISSING_USERNAME', 'Username is required');
					if (!password) return yield* badFormDataEntry('MISSING_PASSWORD', 'Password is required');
					if (!email) return yield* badFormDataEntry('MISSING_EMAIL', 'Email is required');
					if (!name)
						return yield* badFormDataEntry('MISSING_DISPLAY_NAME', 'Display name is required');

					const verifyUsernameResponse = yield* verifyUsernameInput(username);
					if (verifyUsernameResponse !== true)
						return yield* badFormDataEntry('Invalid username', verifyUsernameResponse);

					// If the password is invalid, return an error
					const verifyPasswordResponse = yield* verifyPasswordStrength(password);
					if (verifyPasswordResponse !== true) {
						return yield* badFormDataEntry('Invalid password', verifyPasswordResponse);
					}

					const checkEmail = yield* validateEmail(email);

					if (!checkEmail.success)
						return yield* badFormDataEntry('Invalid email', checkEmail.error.message);

					const invalidEmailDomains: string[] = ['example.com', 'test.com', 'testing.com'];

					if (invalidEmailDomains.includes(checkEmail.data.split('@')[1])) {
						return yield* badFormDataEntry('Invalid Email', 'Must be from a valid domain');
					}

					const { usernameSearch, emailSearch } =
						yield* sdk.AUTH.user.searchUsersForUsernameOrEmail(username, checkEmail.data);

					if (usernameSearch.length > 0)
						return yield* badFormDataEntry('Invalid username', 'Username is already in use');
					if (emailSearch.length > 0)
						return yield* badFormDataEntry('Invalid email', 'Email is already in use');

					const newUser = yield* createLocalUser(name, username, email, password);

					yield* sendVerificationEmail(newUser.id);

					yield* createUserSession(newUser.id, ctx);

					return new Response();
				}).pipe(Effect.provide(loginRegisterDependencies)),
			...sharedHandlers,
		},
		{
			cors,
			onError,
		}
	),
};

export const ALL = createSimplePathRouter('studiocms:auth', router);
