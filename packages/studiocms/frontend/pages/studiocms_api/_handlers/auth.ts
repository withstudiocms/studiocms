import { site } from 'astro:config/server';
import { Password, Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { authConfig, developerConfig } from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import { Mailer } from 'studiocms:mailer';
import { Notifications } from 'studiocms:notifier';
import { oAuthProviders } from 'studiocms:plugins/auth/providers';
import { SDKCore } from 'studiocms:sdk';
import templateEngine from 'studiocms:template-engine';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder, HttpServerResponse } from '@effect/platform';
import { NotFound } from '@effect/platform/HttpApiError';
import { StudioCMSAuthApi } from '@withstudiocms/api-spec';
import { AuthAPIError } from '@withstudiocms/api-spec/auth';
import { appendSearchParamsToUrl } from '@withstudiocms/effect';
import { Effect, Layer, pipe } from 'effect';
import { AstroAPIContext } from 'effectify/astro/context';
import { ResponseToHttpServerResponse } from 'effectify/webHandler';
import { AuthSessionCookieName } from '#consts';
import { AuthAPIUtils } from './_utils/auth.js';

const loginRegisterDependencies = Layer.mergeAll(AuthAPIUtils.Default, VerifyEmail.Default);
const forgotPasswordDependencies = Layer.mergeAll(
	Mailer.Default,
	Notifications.Default,
	AuthAPIUtils.Default
);

const authEnabled = routeConfig.dashboardEnabled;
const oAuthEnabled = routeConfig.oAuthEnabled;

const usernameAndPasswordRoutesEnabled =
	authConfig.enabled && authConfig.providers.usernameAndPassword;
const userRegistrationEnabled =
	authConfig.enabled && authConfig.providers.usernameAndPasswordConfig.allowUserRegistration;

const sharedCatchTags = {
	DBClientInitializationError: () =>
		new AuthAPIError({ error: 'Database client initialization failed' }),
	SDKInitializationError: () => new AuthAPIError({ error: 'SDK initialization failed' }),
};

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

/**
 * Effect Layer providing the authentication API handlers, including login, logout, and forgot password functionality.
 */
export const AuthAPIHandler = HttpApiBuilder.group(StudioCMSAuthApi, 'auth', (handlers) =>
	handlers
		.handle(
			'forgotPassword',
			Effect.fn(
				function* ({ payload: { email } }) {
					// If auth is not enabled, return a 404 to avoid exposing the existence of the endpoint
					// If username and password routes are not enabled, return a 404 to avoid exposing the existence of the endpoint
					if (!authEnabled || !usernameAndPasswordRoutesEnabled) {
						return yield* new NotFound();
					}

					// Get the necessary dependencies for the forgot password handler and run them in parallel
					const [sdk, { sendMail }, { sendAdminNotification }, { validateEmail }, ctx] =
						yield* Effect.all([SDKCore, Mailer, Notifications, AuthAPIUtils, AstroAPIContext]);

					// If demo mode is enabled, return an error as this action is not allowed in demo mode to prevent abuse of the forgot password functionality which could lead to spamming users with password reset emails.
					if (developerConfig.demoMode !== false) {
						return yield* new AuthAPIError({
							error: 'Demo mode is enabled, this action is not allowed.',
						});
					}

					// Check if the mailer is enabled
					const config = ctx.locals.StudioCMS.siteConfig.data;

					// If the mailer is not enabled, return an error as we cannot send the password reset email without a mailer configured.
					if (!config.enableMailer) {
						return yield* new AuthAPIError({
							error: 'Mailer is not enabled in the site configuration.',
						});
					}

					// If the email is invalid, return an error
					const checkEmail = yield* validateEmail(email);

					// If the email provided is not a valid email address, return an error. We do this to prevent abuse of the forgot password functionality which could lead to spamming users with password reset emails.
					if (!checkEmail.success) {
						return yield* new AuthAPIError({
							error: checkEmail.error.message,
						});
					}

					// Search for the user by email
					const { emailSearch } = yield* sdk.AUTH.user
						.searchUsersForUsernameOrEmail('', checkEmail.data)
						.pipe(Effect.catchAll(() => new AuthAPIError({ error: 'Unknown Server Error' })));

					// If no user is found with the provided email, return a success message to prevent exposing the existence of the email in the system. This is a common practice to prevent user enumeration attacks.
					if (emailSearch.length === 0) {
						return {
							message: `If an account with the email ${email} exists, a password reset email has been sent.`,
						};
					}

					// Get the first user from the search results. There should only be one user with a given email address as we enforce unique email addresses in the system.
					const user = emailSearch[0];

					// Create a new password reset token for the user
					const token = yield* sdk.resetTokenBucket
						.new(user.id)
						.pipe(
							Effect.catchAll(
								(err) => new AuthAPIError({ error: `Token creation failed: ${err.toString()}` })
							)
						);

					// If token creation failed, return an error
					if (!token) {
						return yield* new AuthAPIError({
							error: 'Failed to create password reset token.',
						});
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
						return yield* new AuthAPIError({
							error: 'User does not have an email address.',
						});
					}

					// Get the HTML template for the password reset email
					const engine = yield* templateEngine;
					const { title: siteTitle, description, siteIcon } = config;

					// Render the password reset email template with the reset link and site information
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

					// If sending the email failed, return an error
					if (!mailRes) {
						return yield* new AuthAPIError({
							error: 'Failed to send password reset email.',
						});
					}

					// If the mailer returned an error, return an error
					if ('error' in mailRes) {
						return yield* new AuthAPIError({
							error: `Failed to send password reset email: ${mailRes.error}`,
						});
					}

					// Return a success message indicating that the password reset email has been sent. We do this regardless of whether the email was actually sent or not to prevent abuse of the forgot password functionality which could lead to spamming users with password reset emails.
					return {
						message: `If an account with the email ${email} exists, a password reset email has been sent.`,
					};
				},
				// Provide the necessary dependencies for the forgot password handler
				Effect.provide(forgotPasswordDependencies),
				// Catch any errors that occur during the forgot password process and return a generic error message to prevent exposing sensitive information about the failure.
				Effect.catchTags(sharedCatchTags)
			)
		)
		.handle(
			'login',
			Effect.fn(
				function* ({ payload: { username, password } }) {
					// If auth is not enabled, return a 404 to avoid exposing the existence of the endpoint
					// If username and password routes are not enabled, return a 404 to avoid exposing the existence of the endpoint
					if (!authEnabled || !usernameAndPasswordRoutesEnabled) {
						return yield* new NotFound();
					}

					// Get the necessary dependencies for the login handler and run them in parallel
					const [sdk, { verifyPasswordHash }, { createUserSession }, { isEmailVerified }, ctx] =
						yield* Effect.all([
							SDKCore,
							Password,
							Session.pipe(
								Effect.catchAll(
									() => new AuthAPIError({ error: 'Session management initialization failed' })
								)
							),
							VerifyEmail,
							AstroAPIContext,
						]);

					// Get the user by username. We need to get the user first before we can verify the password to prevent timing attacks that could be used to enumerate valid usernames in the system.
					const existingUser = yield* sdk.GET.users
						.byUsername(username)
						.pipe(
							Effect.catchAll(() => new AuthAPIError({ error: 'Invalid username or password' }))
						);

					// If no user is found with the provided username, return an error
					if (!existingUser) {
						return yield* new AuthAPIError({ error: 'Invalid username or password' });
					}

					// If the user is found but does not have a password hash, return an error. This could happen if the user was created with OAuth and does not have a local password.
					if (!existingUser.password) {
						return yield* new AuthAPIError({ error: 'Invalid username or password' });
					}

					// Verify the provided password against the stored password hash
					const validPassword = yield* verifyPasswordHash(existingUser.password, password);

					// If the password is invalid, return an error
					if (!validPassword) {
						return yield* new AuthAPIError({ error: 'Invalid username or password' });
					}

					// If the user's email is not verified, return an error. We require email verification for users with local credentials to ensure that they have access to the email address associated with their account, which is important for account recovery and security notifications.
					const emailVerified = yield* isEmailVerified(existingUser);

					// If the email is not verified, return an error prompting the user to verify their email before logging in. We do this to prevent users from logging in with unverified email addresses, which could lead to security issues and account recovery problems.
					if (!emailVerified) {
						return yield* new AuthAPIError({
							error: 'Email address is not verified. Please verify your email before logging in.',
						});
					}

					// Create a new session for the user
					yield* createUserSession(existingUser.id, ctx);

					// Return a success message indicating that the login was successful. The frontend can then handle the response and redirect the user to the appropriate page.
					return {
						ok: true,
					};
				},
				// Provide the necessary dependencies for the login handler
				Effect.provide(loginRegisterDependencies),
				// Catch any errors that occur during the login process and return a generic error message to prevent exposing sensitive information about the failure.
				Effect.catchTags({
					...sharedCatchTags,
				})
			)
		)
		.handle(
			'logout',
			Effect.fn(function* () {
				// If auth is not enabled, return a 404 to avoid exposing the existence of the endpoint
				if (!authEnabled) {
					return yield* new NotFound();
				}

				// Get the necessary dependencies for the logout handler and run them in parallel
				const [{ validateSessionToken, deleteSessionTokenCookie, invalidateSession }, ctx] =
					yield* Effect.all([
						Session.pipe(
							Effect.catchAll(
								() => new AuthAPIError({ error: 'Session management initialization failed' })
							)
						),
						AstroAPIContext,
					]);

				// Get the cookies from the context to access the session token cookie
				const { cookies } = ctx;

				// Get the session token from the cookies, if it exists
				const sessionToken = cookies.get(AuthSessionCookieName)?.value ?? null;

				// If no session token is found, clear the session cookie just in case and redirect to the login page. We do this to ensure that if there is an invalid or expired session token cookie, we clear it and prompt the user to log in again rather than leaving them with a non-functional session cookie.
				if (!sessionToken) {
					yield* deleteSessionTokenCookie(ctx).pipe(
						Effect.catchAll(() => new AuthAPIError({ error: 'Failed to clear session cookie' }))
					);
					return HttpServerResponse.redirect(StudioCMSRoutes.authLinks.loginURL); // Redirect to login if no session token is found
				}

				// Validate the session token to get the associated session and user data. If the token is invalid or expired, clear the session cookie and redirect to the login page. If the token is valid, invalidate the session and clear the session cookie to log the user out, then redirect to the main site URL.
				const { session, user } = yield* validateSessionToken(sessionToken).pipe(
					Effect.catchAll(() => new AuthAPIError({ error: 'Invalid session token' }))
				);

				// If the session token is invalid or expired, clear the session cookie and redirect to the login page. We do this to ensure that if there is an invalid or expired session token cookie, we clear it and prompt the user to log in again rather than leaving them with a non-functional session cookie.
				if (!session || !user) {
					yield* deleteSessionTokenCookie(ctx).pipe(
						Effect.catchAll(() => new AuthAPIError({ error: 'Failed to clear session cookie' }))
					);
					return HttpServerResponse.redirect(StudioCMSRoutes.authLinks.loginURL);
				}

				// Invalidate the session and delete the session token cookie
				yield* Effect.all([invalidateSession(session.id), deleteSessionTokenCookie(ctx)]).pipe(
					Effect.catchAll(() => new AuthAPIError({ error: 'Failed to log out' }))
				);

				// Redirect to the main site URL after successful logout
				return HttpServerResponse.redirect(StudioCMSRoutes.mainLinks.baseSiteURL);
			})
		)
		.handle(
			'register',
			Effect.fn(
				function* ({ payload: { username, password, email, displayname } }) {
					// If auth is not enabled, return a 404 to avoid exposing the existence of the endpoint
					if (!authEnabled || !usernameAndPasswordRoutesEnabled || !userRegistrationEnabled) {
						return yield* new NotFound();
					}

					// Get the necessary dependencies for the register handler and run them in parallel
					const [
						sdk,
						{ validateEmail },
						{ verifyUsernameInput, createLocalUser },
						{ sendVerificationEmail },
						{ verifyPasswordStrength },
						{ createUserSession },
						ctx,
					] = yield* Effect.all([
						SDKCore,
						AuthAPIUtils,
						User.pipe(
							Effect.catchAll(
								() => new AuthAPIError({ error: 'User management initialization failed' })
							)
						),
						VerifyEmail,
						Password,
						Session.pipe(
							Effect.catchAll(
								() => new AuthAPIError({ error: 'Session management initialization failed' })
							)
						),
						AstroAPIContext,
					]);

					const [verifyUsernameResponse, verifyPasswordResponse, checkEmail] = yield* Effect.all([
						verifyUsernameInput(username),
						verifyPasswordStrength(password),
						validateEmail(email),
					]).pipe(
						Effect.catchAll((err) => {
							console.error('Validation error:', err);
							return new AuthAPIError({ error: `Validation failed: ${String(err)}` });
						})
					);

					// If the username validation failed, return an error with the validation message
					if (verifyUsernameResponse !== true) {
						return yield* new AuthAPIError({
							error: `Invalid username: ${verifyUsernameResponse}`,
						});
					}

					// If the password validation failed, return an error with the validation message
					if (verifyPasswordResponse !== true) {
						return yield* new AuthAPIError({
							error: `Invalid password: ${verifyPasswordResponse}`,
						});
					}

					// If the email provided is not a valid email address, return an error. We do this to prevent abuse of the forgot password functionality which could lead to spamming users with password reset emails.
					if (!checkEmail.success) {
						return yield* new AuthAPIError({
							error: checkEmail.error.message,
						});
					}

					// Check if the username or email already exists in the system. We do this after validating the input to prevent unnecessary database queries for invalid input.
					const { usernameSearch, emailSearch } = yield* sdk.AUTH.user
						.searchUsersForUsernameOrEmail(username, checkEmail.data)
						.pipe(Effect.catchAll(() => new AuthAPIError({ error: 'Unknown Server Error' })));

					// If either the username or email already exists, return an error indicating that an account with the provided username or email already exists. We do this to prevent duplicate accounts and to enforce unique usernames and email addresses in the system.
					if (usernameSearch.length > 0 || emailSearch.length > 0) {
						return yield* new AuthAPIError({
							error: 'An account with this username or email already exists.',
						});
					}

					// Create the new user, send the verification email, and create a session for the user in parallel. We do this to optimize the registration process and reduce the time it takes for the user to be able to use their account after registering.
					yield* createLocalUser(displayname, username, email, password).pipe(
						Effect.flatMap((newUser) =>
							Effect.all([
								sendVerificationEmail(newUser.id).pipe(
									Effect.catchAll(
										(err) => new AuthAPIError({ error: `User creation failed: ${String(err)}` })
									)
								),
								createUserSession(newUser.id, ctx).pipe(
									Effect.catchAll(
										(err) => new AuthAPIError({ error: `User creation failed: ${String(err)}` })
									)
								),
							])
						)
					);

					// Return a success message indicating that the registration was successful. The frontend can then handle the response and redirect the user to the appropriate page, such as a page prompting them to verify their email address.
					return { ok: true };
				},
				// Provide the necessary dependencies for the login handler
				Effect.provide(loginRegisterDependencies),
				// Catch any errors that occur during the login process and return a generic error message to prevent exposing sensitive information about the failure.
				Effect.catchTags({
					...sharedCatchTags,
				})
			)
		)
);

/**
 * OAuth API Handler for managing OAuth authentication flows, including initiating OAuth sessions and handling OAuth callbacks.
 */
export const OAuthAPIHandler = HttpApiBuilder.group(StudioCMSAuthApi, 'oauth', (handlers) =>
	handlers
		.handle(
			'oAuthInit',
			Effect.fn(function* ({ path: { provider } }) {
				// If auth or oAuth is not enabled, return a 404 to avoid exposing the existence of the endpoint
				if (!authEnabled || !oAuthEnabled) {
					return yield* new NotFound();
				}

				// Find the provider configuration based on the provider name in the path parameters.
				const matchedProvider = oAuthProviders.find((p) => p.safeName === provider);

				// If the provider is not found, not enabled, or does not have an initSession handler, return a 404 to avoid exposing the existence of the endpoint or the provider.
				if (!matchedProvider || !matchedProvider.enabled || !matchedProvider.initSession) {
					return yield* new NotFound();
				}

				// Get the API context to pass to the provider handler, which may need it to access request information, cookies, etc.
				const ctx = yield* AstroAPIContext;

				// Call the provider's initSession handler to start the OAuth flow. This will typically redirect the user to the provider's authentication page. We wrap this in a try-catch to handle any errors that may occur during the provider handler execution and return a generic error message to prevent exposing sensitive information about the failure.
				const res = yield* Effect.tryPromise(async () => matchedProvider.initSession?.(ctx)).pipe(
					Effect.catchAll((error) => {
						console.error('API Error:', error);
						return new AuthAPIError({ error: 'Internal Server Error' });
					})
				);

				// If the provider handler did not return a response, return an error indicating that the OAuth session initialization failed.
				if (!res) {
					return yield* new AuthAPIError({ error: 'Failed to initialize OAuth session' });
				}

				// Convert the provider handler's response to an HTTP server response that can be returned to the client. This will typically be a redirect response to the provider's authentication page.
				return yield* ResponseToHttpServerResponse(res);
			})
		)
		.handle(
			'oAuthCallback',
			Effect.fn(function* ({ path: { provider } }) {
				// If auth or oAuth is not enabled, return a 404 to avoid exposing the existence of the endpoint
				if (!authEnabled || !oAuthEnabled) {
					return yield* new NotFound();
				}

				// Find the provider configuration based on the provider name in the path parameters.
				const matchedProvider = oAuthProviders.find((p) => p.safeName === provider);

				// If the provider is not found, not enabled, or does not have an initCallback handler, return a 404 to avoid exposing the existence of the endpoint or the provider.
				if (!matchedProvider || !matchedProvider.enabled || !matchedProvider.initCallback) {
					return yield* new NotFound();
				}

				// Get the API context to pass to the provider handler, which may need it to access request information, cookies, etc.
				const ctx = yield* AstroAPIContext;

				// Call the provider's initCallback handler to complete the OAuth flow. This will typically handle the callback from the provider after the user has authenticated and create a session for the user in the system. We wrap this in a try-catch to handle any errors that may occur during the provider handler execution and return a generic error message to prevent exposing sensitive information about the failure.
				const res = yield* Effect.tryPromise(async () => matchedProvider.initCallback?.(ctx)).pipe(
					Effect.catchAll((error) => {
						console.error('API Error:', error);
						return new AuthAPIError({ error: 'Internal Server Error' });
					})
				);

				// If the provider handler did not return a response, return an error indicating that the OAuth callback initialization failed.
				if (!res) {
					return yield* new AuthAPIError({ error: 'Failed to initialize OAuth callback' });
				}

				// Convert the provider handler's response to an HTTP server response that can be returned to the client. This will typically be a redirect response to the main site or dashboard after successful authentication.
				return yield* ResponseToHttpServerResponse(res);
			})
		)
);

/**
 * Combined API Handler for all authentication-related endpoints, including both primary auth handlers and OAuth handlers.
 */
const AuthApiHandlersGroup = Layer.merge(AuthAPIHandler, OAuthAPIHandler);

/**
 * Live implementation of the authentication API, providing handlers for login, logout, and forgot password functionality.
 */
export const AuthAPILive = HttpApiBuilder.api(StudioCMSAuthApi).pipe(
	Layer.provide(AuthApiHandlersGroup)
);
