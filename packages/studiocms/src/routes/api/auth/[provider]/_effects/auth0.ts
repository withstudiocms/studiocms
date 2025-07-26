import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import config from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import { FetchHttpClient, HttpClient, HttpClientResponse } from '@effect/platform';
import { generateCodeVerifier, generateState } from 'arctic';
import { Auth0 } from 'arctic';
import type { APIContext } from 'astro';
import { Effect, genLogger } from '../../../../../effect.js';
import {
	AuthEnvCheck,
	Provider,
	ValidateAuthCodeError,
	getCookie,
	getUrlParam,
} from './_shared.js';
import { Auth0User, cleanDomain } from './_shared.js';

/**
 * Provides Auth0 OAuth authentication effects for the StudioCMS API.
 *
 * This service handles the OAuth flow with Auth0, including session initialization,
 * authorization code validation, user account linking, and user creation.
 *
 * @remarks
 * - Uses generator-based effects for async operations.
 * - Integrates with session management, user library, and email verification.
 * - Handles first-time setup and redirects based on authentication state.
 *
 * @example
 * ```typescript
 * const auth0Api = yield* Auth0OAuthAPI;
 * yield* auth0Api.initSession(context);
 * yield* auth0Api.initCallback(context);
 * ```
 *
 * @dependencies
 * - Session.Default
 * - SDKCore.Default
 * - VerifyEmail.Default
 * - User.Default
 *
 * @method initSession
 * Initializes the OAuth session by generating state and code verifier, setting cookies,
 * and redirecting to the Auth0 authorization URL.
 *
 * @method initCallback
 * Handles the OAuth callback, validates the authorization code, manages user linking,
 * creates new users if necessary, verifies email, and creates user sessions.
 */
export class Auth0OAuthAPI extends Effect.Service<Auth0OAuthAPI>()('Auth0OAuthAPI', {
	dependencies: [Session.Default, VerifyEmail.Default, User.Default, FetchHttpClient.layer],
	effect: genLogger('studiocms/routes/api/auth/auth0/effect')(function* () {
		const [
			sdk,
			fetchClient,
			{ setOAuthSessionTokenCookie, createUserSession },
			{ isEmailVerified, sendVerificationEmail },
			{ getUserData, createOAuthUser },
			{
				AUTH0: { CLIENT_ID = '', CLIENT_SECRET = '', DOMAIN = '', REDIRECT_URI = '' },
			},
		] = yield* Effect.all([
			SDKCore,
			HttpClient.HttpClient,
			Session,
			VerifyEmail,
			User,
			AuthEnvCheck,
		]);

		const CLIENT_DOMAIN = cleanDomain(DOMAIN);

		const auth0 = new Auth0(CLIENT_DOMAIN, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

		const validateAuthCode = (code: string, codeVerifier: string) =>
			genLogger('studiocms/routes/api/auth/auth0/effect.validateAuthCode')(function* () {
				const tokens = yield* Effect.tryPromise(() =>
					auth0.validateAuthorizationCode(code, codeVerifier)
				);

				return yield* fetchClient
					.get(`${CLIENT_DOMAIN}/userinfo`, {
						headers: { Authorization: `Bearer ${tokens.accessToken()}` },
					})
					.pipe(
						Effect.flatMap(HttpClientResponse.schemaBodyJson(Auth0User)),
						Effect.catchAll((error) =>
							Effect.fail(
								new ValidateAuthCodeError({
									provider: Auth0OAuthAPI.ProviderID,
									message: `Failed to fetch user info: ${error.message}`,
								})
							)
						)
					);
			});

		return {
			initSession: (context: APIContext) =>
				genLogger('studiocms/routes/api/auth/auth0/effect.initSession')(function* () {
					const state = generateState();
					const codeVerifier = generateCodeVerifier();
					const scopes = ['openid', 'profile', 'email'];

					const url = auth0.createAuthorizationURL(state, codeVerifier, scopes);

					yield* setOAuthSessionTokenCookie(context, Auth0OAuthAPI.ProviderCookieName, state);

					yield* setOAuthSessionTokenCookie(
						context,
						Auth0OAuthAPI.ProviderCodeVerifier,
						codeVerifier
					);

					return context.redirect(url.toString());
				}),
			initCallback: (context: APIContext) =>
				genLogger('studiocms/routes/api/auth/auth0/effect.initCallback')(function* () {
					const { cookies, redirect } = context;

					const [code, state, storedState, codeVerifier] = yield* Effect.all([
						getUrlParam(context, 'code'),
						getUrlParam(context, 'state'),
						getCookie(context, Auth0OAuthAPI.ProviderCookieName),
						getCookie(context, Auth0OAuthAPI.ProviderCodeVerifier),
					]);

					if (!code || !storedState || !codeVerifier || state !== storedState) {
						return redirect(StudioCMSRoutes.authLinks.loginURL);
					}

					const auth0User = yield* validateAuthCode(code, codeVerifier);

					const { sub: auth0UserId, name: auth0Username } = auth0User;

					const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId(
						Auth0OAuthAPI.ProviderID,
						auth0UserId
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
								provider: Auth0OAuthAPI.ProviderID,
								providerUserId: auth0UserId,
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
							username: auth0Username,
							name: auth0User.name,
							email: auth0User.email,
							avatar: auth0User.picture,
							createdAt: new Date(),
						},
						{ provider: Auth0OAuthAPI.ProviderID, providerUserId: auth0UserId }
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
	static ProviderID = Provider.AUTH0;
	static ProviderCookieName = 'auth0_oauth_state';
	static ProviderCodeVerifier = 'auth0_oauth_code_verifier';
}
