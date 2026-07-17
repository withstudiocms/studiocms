import { getSecret } from 'astro:env/server';
import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import { Google, generateCodeVerifier, generateState } from 'arctic';
import type { APIContext } from 'astro';
import { Effect, genLogger, Platform, Schema } from 'studiocms/effect';
import { getCookie, getUrlParam, ValidateAuthCodeError } from 'studiocms/oAuthUtils';
import {
	handleExistingOAuthAccount,
	handleNewOAuthUser,
	handleOAuthLinking,
} from '../shared.js';

/**
 * Represents a user authenticated via Google OAuth.
 *
 * @property sub - The unique identifier for the user (subject).
 * @property picture - The URL of the user's profile picture.
 * @property name - The full name of the user.
 * @property email - The user's email address.
 */
export class GoogleUser extends Schema.Class<GoogleUser>('GoogleUser')({
	sub: Schema.String,
	picture: Schema.String,
	name: Schema.String,
	email: Schema.String,
}) {}

const GOOGLE = {
	CLIENT_ID: getSecret('CMS_GOOGLE_CLIENT_ID') ?? '',
	CLIENT_SECRET: getSecret('CMS_GOOGLE_CLIENT_SECRET') ?? '',
	REDIRECT_URI: getSecret('CMS_GOOGLE_REDIRECT_URI') ?? '',
};

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
	dependencies: [VerifyEmail.Default, Platform.FetchHttpClient.layer],
	effect: genLogger('studiocms/routes/api/auth/google/effect')(function* () {
		const [sdk, fetchClient, { setOAuthSessionTokenCookie }, { createOAuthUser }] =
			yield* Effect.all([SDKCore, Platform.HttpClient.HttpClient, Session, User]);

		const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = GOOGLE;

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
						Effect.flatMap(Platform.HttpClientResponse.schemaBodyJson(GoogleUser)),
						Effect.mapError(
							(error) =>
								new ValidateAuthCodeError({
									provider: GoogleOAuthAPI.ProviderID,
									message: `Failed to fetch user info: ${error.message}`,
								})
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
					const { redirect } = context;

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

					const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId({
						providerId: GoogleOAuthAPI.ProviderID,
						userId: googleUserId,
					});

					if (existingOAuthAccount) {
						return yield* handleExistingOAuthAccount(context, existingOAuthAccount).pipe(Effect.provide(VerifyEmail.Default));
					}

					const linkResult = yield* handleOAuthLinking(
						context,
						GoogleOAuthAPI.ProviderID,
						googleUserId
					).pipe(Effect.provide(VerifyEmail.Default));
					if (linkResult) return linkResult;

					const newUser = yield* createOAuthUser(
						{
							id: crypto.randomUUID(),
							username: googleUsername,
							email: googleUser.email,
							name: googleUser.name,
							avatar: googleUser.picture,
							createdAt: new Date().toISOString(),
							emailVerified: false,
							notifications: null,
							password: null,
							updatedAt: new Date().toISOString(),
							url: null,
						},
						{ provider: GoogleOAuthAPI.ProviderID, providerUserId: googleUserId }
					);

					return yield* handleNewOAuthUser(context, newUser).pipe(Effect.provide(VerifyEmail.Default));
				}),
		};
	}),
}) {
	static ProviderID = 'google';
	static ProviderCookieName = 'google_oauth_state';
	static ProviderCodeVerifier = 'google_oauth_code_verifier';
}
