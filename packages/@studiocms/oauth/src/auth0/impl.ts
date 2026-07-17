import { getSecret } from 'astro:env/server';
import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import { Auth0, generateCodeVerifier, generateState } from 'arctic';
import { Effect, genLogger, Platform, pipe, Schema } from 'studiocms/effect';
import { getCookie, getUrlParam, ValidateAuthCodeError } from 'studiocms/oAuthUtils';
import { OAuthService } from '../service.js';
import { handleExistingOAuthAccount, handleNewOAuthUser, handleOAuthLinking } from '../shared.js';

/**
 * Represents a user authenticated via Auth0.
 *
 * @property {string} sub - The unique identifier for the user (subject).
 * @property {string} name - The full name of the user.
 * @property {string} email - The email address of the user.
 * @property {string} picture - The URL to the user's profile picture.
 * @property {string} nickname - The user's nickname.
 */
export class Auth0User extends Schema.Class<Auth0User>('Auth0User')({
	sub: Schema.String,
	name: Schema.String,
	email: Schema.String,
	picture: Schema.String,
	nickname: Schema.String,
}) {}

export const ProviderID = 'auth0';
export const ProviderCookieName = 'auth0_oauth_state';
export const ProviderCodeVerifier = 'auth0_oauth_code_verifier';

/**
 * Returns the normalized domain string for Auth0 authentication.
 *
 * This function performs the following transformations:
 * - Removes any leading slash from the domain.
 * - Strips out the "http://" or "https://" protocol from the domain.
 * - Prepends "https://" to the resulting domain.
 *
 * @returns {string} The normalized domain string with "https://" prepended.
 */
export const cleanDomain = (domain: string): string =>
	pipe(
		domain,
		(domain) => domain.replace(/^\//, ''),
		(domain) => domain.replace(/(?:http|https):\/\//, ''),
		(domain) => `https://${domain}`
	);

/**
 * Provides Auth0 OAuth authentication effects for the StudioCMS API.
 *
 * This service handles the OAuth flow for Auth0, including:
 * - Initializing the OAuth session and redirecting users to Auth0 for authorization.
 * - Validating the authorization code returned by Auth0 and fetching user data.
 * - Handling the callback from Auth0, including:
 *   - Linking OAuth accounts to existing users.
 *   - Creating new users from Auth0 profile data.
 *   - Verifying user email addresses.
 *   - Creating user sessions and redirecting to appropriate pages.
 *
 * @remarks
 * - Depends on session management, user library, email verification, and SDK core services.
 * - Handles both first-time setup and linking additional OAuth providers to existing accounts.
 */
export const Auth0OAuthAPI = genLogger('@studiocms/oauth/auth0/impl')(function* () {
	const [sdk, fetchClient, { setOAuthSessionTokenCookie }, { createOAuthUser }] = yield* Effect.all(
		[SDKCore, Platform.HttpClient.HttpClient, Session, User]
	);

	const CLIENT_DOMAIN = cleanDomain(getSecret('CMS_AUTH0_DOMAIN') || '');
	const CLIENT_ID = getSecret('CMS_AUTH0_CLIENT_ID') || '';
	const CLIENT_SECRET = getSecret('CMS_AUTH0_CLIENT_SECRET') || '';
	const REDIRECT_URI = getSecret('CMS_AUTH0_REDIRECT_URI') || '';

	const auth0 = new Auth0(CLIENT_DOMAIN, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

	const validateAuthCode = (code: string, codeVerifier: string) =>
		genLogger('@studiocms/oauth/auth0/impl.validateAuthCode')(function* () {
			const tokens = yield* Effect.tryPromise(() =>
				auth0.validateAuthorizationCode(code, codeVerifier)
			);

			return yield* fetchClient
				.get(`${CLIENT_DOMAIN}/userinfo`, {
					headers: { Authorization: `Bearer ${tokens.accessToken()}` },
				})
				.pipe(
					Effect.flatMap(Platform.HttpClientResponse.schemaBodyJson(Auth0User)),
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
			genLogger('@studiocms/oauth/auth0/impl.initSession')(function* () {
				const state = generateState();
				const codeVerifier = generateCodeVerifier();
				const scopes = ['openid', 'profile', 'email'];
				const url = auth0.createAuthorizationURL(state, codeVerifier, scopes);
				yield* setOAuthSessionTokenCookie(context, ProviderCookieName, state);
				yield* setOAuthSessionTokenCookie(context, ProviderCodeVerifier, codeVerifier);
				return context.redirect(url.toString());
			}),
		initCallback: (context) =>
			genLogger('@studiocms/oauth/auth0/impl.initCallback')(function* () {
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

				const auth0User = yield* validateAuthCode(code, codeVerifier);

				const { sub: auth0UserId, name: auth0Username } = auth0User;

				const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId({
					providerId: ProviderID,
					userId: auth0UserId,
				});

				if (existingOAuthAccount) {
					return yield* handleExistingOAuthAccount(context, existingOAuthAccount);
				}

				const linkResult = yield* handleOAuthLinking(context, ProviderID, auth0UserId);

				if (linkResult) return linkResult;

				const newUser = yield* createOAuthUser(
					{
						id: crypto.randomUUID(),
						username: auth0Username,
						name: auth0User.name,
						email: auth0User.email,
						avatar: auth0User.picture,
						createdAt: new Date().toISOString(),
						emailVerified: false,
						notifications: null,
						password: null,
						updatedAt: new Date().toISOString(),
						url: null,
					},
					{ provider: ProviderID, providerUserId: auth0UserId }
				);

				return yield* handleNewOAuthUser(context, newUser);
			}).pipe(Effect.provide(VerifyEmail.Default)),
	});
}).pipe(Effect.provide(Platform.FetchHttpClient.layer));
