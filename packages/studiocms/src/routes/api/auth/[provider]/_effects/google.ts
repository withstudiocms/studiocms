import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import config from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import { FetchHttpClient, HttpClient, HttpClientResponse } from '@effect/platform';
import { generateCodeVerifier, generateState } from 'arctic';
import { Google } from 'arctic';
import type { APIContext } from 'astro';
import { Effect, genLogger } from '../../../../../effect.js';
import {
	AuthEnvCheck,
	Provider,
	ValidateAuthCodeError,
	getCookie,
	getUrlParam,
} from './_shared.js';
import { GoogleUser } from './_shared.js';

/**
 * Provides Google OAuth authentication effects for the StudioCMS API.
 *
 * @remarks
 * This service handles the OAuth flow for Google authentication, including session initialization,
 * authorization code validation, user account linking, and user creation. It integrates with
 * session management, user data libraries, and email verification.
 *
 * @example
 * ```typescript
 * const googleOAuth = new GoogleOAuthAPI();
 * yield* googleOAuth.initSession(context);
 * yield* googleOAuth.initCallback(context);
 * ```
 *
 * @method initSession
 * Initializes the OAuth session by generating a state and code verifier, setting cookies,
 * and redirecting the user to Google's authorization URL.
 *
 * @param context - The API context containing request and response information.
 * @returns Redirects the user to the Google OAuth authorization URL.
 *
 * @method initCallback
 * Handles the OAuth callback from Google. Validates the authorization code and state,
 * fetches user information, links or creates user accounts, verifies email, and creates a user session.
 *
 * @param context - The API context containing request and response information.
 * @returns Redirects the user to the appropriate page based on authentication and verification status.
 *
 * @dependencies
 * - Session.Default: Session management utilities.
 * - SDKCore.Default: Core SDK for user and OAuth provider operations.
 * - VerifyEmail.Default: Email verification utilities.
 * - User.Default: User data management utilities.
 */
export class GoogleOAuthAPI extends Effect.Service<GoogleOAuthAPI>()('GoogleOAuthAPI', {
	dependencies: [Session.Default, VerifyEmail.Default, User.Default, FetchHttpClient.layer],
	effect: genLogger('studiocms/routes/api/auth/google/effect')(function* () {
		const [
			sdk,
			fetchClient,
			{ setOAuthSessionTokenCookie, createUserSession },
			{ isEmailVerified, sendVerificationEmail },
			{ getUserData, createOAuthUser },
			{
				GOOGLE: { CLIENT_ID = '', CLIENT_SECRET = '', REDIRECT_URI = '' },
			},
		] = yield* Effect.all([
			SDKCore,
			HttpClient.HttpClient,
			Session,
			VerifyEmail,
			User,
			AuthEnvCheck,
		]);

		const google = new Google(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

		const validateAuthCode = (code: string, codeVerifier: string) =>
			genLogger('studiocms/routes/api/auth/google/effect.validateAuthCode')(function* () {
				const tokens = yield* Effect.tryPromise(() =>
					google.validateAuthorizationCode(code, codeVerifier)
				);

				return yield* fetchClient
					.get('https://openidconnect.googleapis.com/v1/userinfo', {
						headers: {
							Authorization: `Bearer ${tokens.accessToken}`,
						},
					})
					.pipe(
						Effect.flatMap(HttpClientResponse.schemaBodyJson(GoogleUser)),
						Effect.catchAll((error) =>
							Effect.fail(
								new ValidateAuthCodeError({
									provider: GoogleOAuthAPI.ProviderID,
									message: `Failed to fetch user info: ${error.message}`,
								})
							)
						)
					);
			});

		return {
			initSession: (context: APIContext) =>
				genLogger('studiocms/routes/api/auth/google/effect.initSession')(function* () {
					const state = generateState();
					const codeVerifier = generateCodeVerifier();
					const scopes = ['profile', 'email'];

					const url = google.createAuthorizationURL(state, codeVerifier, scopes);

					yield* setOAuthSessionTokenCookie(context, GoogleOAuthAPI.ProviderCookieName, state);

					yield* setOAuthSessionTokenCookie(
						context,
						GoogleOAuthAPI.ProviderCodeVerifier,
						codeVerifier
					);

					return context.redirect(url.toString());
				}),
			initCallback: (context: APIContext) =>
				genLogger('studiocms/routes/api/auth/google/effect.initCallback')(function* () {
					const { cookies, redirect } = context;

					const [code, state, storedState, codeVerifier] = yield* Effect.all([
						getUrlParam(context, 'code'),
						getUrlParam(context, 'state'),
						getCookie(context, GoogleOAuthAPI.ProviderCookieName),
						getCookie(context, GoogleOAuthAPI.ProviderCodeVerifier),
					]);

					if (!code || !storedState || !codeVerifier || state !== storedState) {
						return redirect(StudioCMSRoutes.authLinks.loginURL);
					}

					const googleUser = yield* validateAuthCode(code, codeVerifier);

					const { sub: googleUserId, name: googleUsername } = googleUser;

					const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId(
						GoogleOAuthAPI.ProviderID,
						googleUserId
					);

					if (existingOAuthAccount) {
						const user = yield* sdk.GET.users.byId(existingOAuthAccount.userId);

						if (!user) {
							return new Response('User not found', { status: 404 });
						}

						const isEmailAccountVerified = yield* isEmailVerified(user);

						// If Mailer is enabled, is the user verified?
						if (!isEmailAccountVerified) {
							return new Response('Email not verified, please verify your account first.', {
								status: 400,
							});
						}

						yield* createUserSession(user.id, context);

						return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
					}

					const loggedInUser = yield* getUserData(context);
					const linkNewOAuth = !!cookies.get(User.LinkNewOAuthCookieName)?.value;

					if (loggedInUser.user && linkNewOAuth) {
						const existingUser = yield* sdk.GET.users.byId(loggedInUser.user.id);

						if (existingUser) {
							yield* sdk.AUTH.oAuth.create({
								userId: existingUser.id,
								provider: GoogleOAuthAPI.ProviderID,
								providerUserId: googleUserId,
							});

							const isEmailAccountVerified = yield* isEmailVerified(existingUser);

							// If Mailer is enabled, is the user verified?
							if (!isEmailAccountVerified) {
								return new Response('Email not verified, please verify your account first.', {
									status: 400,
								});
							}

							yield* createUserSession(existingUser.id, context);

							return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
						}
					}

					const newUser = yield* createOAuthUser(
						{
							// @ts-expect-error drizzle broke the id variable...
							id: crypto.randomUUID(),
							username: googleUsername,
							email: googleUser.email,
							name: googleUser.name,
							avatar: googleUser.picture,
							createdAt: new Date(),
						},
						{ provider: GoogleOAuthAPI.ProviderID, providerUserId: googleUserId }
					);

					if ('error' in newUser) {
						return new Response('Error creating user', { status: 500 });
					}

					// FIRST-TIME-SETUP
					if (config.dbStartPage) {
						return redirect('/done');
					}

					yield* sendVerificationEmail(newUser.id, true);

					const existingUser = yield* sdk.GET.users.byId(newUser.id);

					const isEmailAccountVerified = yield* isEmailVerified(existingUser);

					// If Mailer is enabled, is the user verified?
					if (!isEmailAccountVerified) {
						return new Response('Email not verified, please verify your account first.', {
							status: 400,
						});
					}

					yield* createUserSession(newUser.id, context);

					return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
				}),
		};
	}),
}) {
	static ProviderID = Provider.GOOGLE;
	static ProviderCookieName = 'google_oauth_state';
	static ProviderCodeVerifier = 'google_oauth_code_verifier';
}
