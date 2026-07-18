import { getSecret } from 'astro:env/server';
import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import { Google, generateCodeVerifier, generateState } from 'arctic';
import { Effect, genLogger, Platform, Schema } from 'studiocms/effect';
import { getCookie, getUrlParam, ValidateAuthCodeError } from 'studiocms/oAuthUtils';
import { OAuthService } from '../service.js';
import { handleExistingOAuthAccount, handleNewOAuthUser, handleOAuthLinking } from '../shared.js';

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

export const ProviderID = 'google';
export const ProviderCookieName = 'google_oauth_state';
export const ProviderCodeVerifier = 'google_oauth_code_verifier';

/**
 * Provides Google OAuth authentication effects for the StudioCMS API.
 *
 * @remarks
 * This service handles the OAuth flow for Google authentication, including session initialization,
 * authorization code validation, user account linking, and user creation. It integrates with
 * session management, user data libraries, and email verification.
 */
export const GoogleOAuthAPI = genLogger('@studiocms/oauth/google/impl')(function* () {
	const [sdk, fetchClient, { setOAuthSessionTokenCookie }, { createOAuthUser }] = yield* Effect.all(
		[SDKCore, Platform.HttpClient.HttpClient, Session, User]
	);

	const CLIENT_ID = getSecret('CMS_GOOGLE_CLIENT_ID') ?? '';
	const CLIENT_SECRET = getSecret('CMS_GOOGLE_CLIENT_SECRET') ?? '';
	const REDIRECT_URI = getSecret('CMS_GOOGLE_REDIRECT_URI') ?? '';

	const google = new Google(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

	const validateAuthCode = (code: string, codeVerifier: string) =>
		genLogger('@studiocms/oauth/google/impl.validateAuthCode')(function* () {
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
								provider: ProviderID,
								message: `Failed to fetch user info: ${error.message}`,
							})
					)
				);
		});

	return OAuthService.of({
		initSession: (context) =>
			genLogger('@studiocms/oauth/google/impl.initSession')(function* () {
				const state = generateState();
				const codeVerifier = generateCodeVerifier();
				const scopes = ['profile', 'email'];
				const url = google.createAuthorizationURL(state, codeVerifier, scopes);
				yield* setOAuthSessionTokenCookie(context, ProviderCookieName, state);
				yield* setOAuthSessionTokenCookie(context, ProviderCodeVerifier, codeVerifier);
				return context.redirect(url.toString());
			}),

		initCallback: (context) =>
			genLogger('@studiocms/oauth/google/impl.initCallback')(function* () {
				const { redirect } = context;

				const [code, state, storedState, codeVerifier] = yield* Effect.all([
					getUrlParam(context, 'code'),
					getUrlParam(context, 'state'),
					getCookie(context, ProviderCookieName),
					getCookie(context, ProviderCodeVerifier),
				]);

				if (!code || !storedState || !codeVerifier || state !== storedState) {
					return redirect(StudioCMSRoutes.authLinks.loginURL);
				}

				const googleUser = yield* validateAuthCode(code, codeVerifier);

				const { sub: googleUserId, name: googleUsername } = googleUser;

				const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId({
					providerId: ProviderID,
					userId: googleUserId,
				});

				if (existingOAuthAccount) {
					return yield* handleExistingOAuthAccount(context, existingOAuthAccount);
				}

				const linkResult = yield* handleOAuthLinking(context, ProviderID, googleUserId);
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
					{ provider: ProviderID, providerUserId: googleUserId }
				);

				return yield* handleNewOAuthUser(context, newUser);
			}).pipe(Effect.provide(VerifyEmail.Default)),
	});
}).pipe(Effect.provide(Platform.FetchHttpClient.layer));
