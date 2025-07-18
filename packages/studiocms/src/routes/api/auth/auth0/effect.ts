import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import config, { authConfig } from 'studiocms:config';
import { SDKCore } from 'studiocms:sdk';
import { generateCodeVerifier, generateState } from 'arctic';
import { Auth0 } from 'arctic';
import type { APIContext } from 'astro';
import { Effect } from 'effect';
import { genLogger } from '../../../../lib/effects/index.js';

export const {
	AUTH0: { CLIENT_ID = '', CLIENT_SECRET = '', DOMAIN, REDIRECT_URI = '' },
} = await authEnvCheck(authConfig.providers);

export const getClientDomain = () => {
	const cleanDomainSlash = DOMAIN ? DOMAIN.replace(/^\//, '') : '';

	const NoHttpDomain = cleanDomainSlash.replace(/http:\/\//, '').replace(/https:\/\//, '');

	return `https://${NoHttpDomain}`;
};

export const ProviderID = 'auth0';
export const ProviderCookieName = 'auth0_oauth_state';
export const ProviderCodeVerifier = 'auth0_oauth_code_verifier';

export const auth0 = new Auth0(getClientDomain(), CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export interface Auth0User {
	sub: string;
	name: string;
	email: string;
	picture: string;
	nickname: string;
}

export class Auth0OAuthAPI extends Effect.Service<Auth0OAuthAPI>()('Auth0OAuthAPI', {
	effect: genLogger('studiocms/routes/api/auth/auth0/effect')(function* () {
		const sessionHelper = yield* Session;
		const sdk = yield* SDKCore;
		const verifyEmail = yield* VerifyEmail;
		const userLib = yield* User;

		const initSession = (context: APIContext) =>
			genLogger('studiocms/routes/api/auth/auth0/effect.initSession')(function* () {
				const state = generateState();

				const codeVerifier = generateCodeVerifier();

				const scopes = ['openid', 'profile', 'email'];

				const url = auth0.createAuthorizationURL(state, codeVerifier, scopes);

				yield* sessionHelper.setOAuthSessionTokenCookie(context, ProviderCookieName, state);

				yield* sessionHelper.setOAuthSessionTokenCookie(
					context,
					ProviderCodeVerifier,
					codeVerifier
				);

				return context.redirect(url.toString());
			});

		const validateAuthCode = (code: string, codeVerifier: string) =>
			genLogger('studiocms/routes/api/auth/auth0/effect.validateAuthCode')(function* () {
				const tokens = yield* Effect.tryPromise(() =>
					auth0.validateAuthorizationCode(code, codeVerifier)
				);

				const CLIENT_DOMAIN = getClientDomain();

				const response = yield* Effect.tryPromise(() =>
					fetch(`${CLIENT_DOMAIN}/userinfo`, {
						headers: {
							Authorization: `Bearer ${tokens.accessToken}`,
						},
					})
				);

				if (!response.ok) {
					yield* Effect.fail(new Error('Failed Authorization Check'));
				}

				const resData: Auth0User = yield* Effect.tryPromise(() => response.json());

				return resData;
			});

		const initCallback = (context: APIContext) =>
			genLogger('studiocms/routes/api/auth/auth0/effect.initCallback')(function* () {
				const { url, cookies, redirect } = context;

				const code = url.searchParams.get('code');
				const state = url.searchParams.get('state');
				const codeVerifier = cookies.get(ProviderCodeVerifier)?.value ?? null;
				const storedState = cookies.get(ProviderCookieName)?.value ?? null;

				if (!code || !storedState || !codeVerifier || state !== storedState) {
					return redirect(context.locals.routeMap.authLinks.loginURL);
				}

				const auth0User = yield* validateAuthCode(code, codeVerifier);

				const { sub: auth0UserId, name: auth0Username } = auth0User;

				const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId(
					ProviderID,
					auth0UserId
				);

				if (existingOAuthAccount) {
					const user = yield* sdk.GET.users.byId(existingOAuthAccount.userId);

					if (!user) {
						return new Response('User not found', { status: 404 });
					}

					const isEmailAccountVerified = yield* verifyEmail.isEmailVerified(user);

					// If Mailer is enabled, is the user verified?
					if (!isEmailAccountVerified) {
						return new Response('Email not verified, please verify your account first.', {
							status: 400,
						});
					}

					yield* sessionHelper.createUserSession(user.id, context);

					return redirect(context.locals.routeMap.mainLinks.dashboardIndex);
				}

				const loggedInUser = yield* userLib.getUserData(context);
				const linkNewOAuth = !!cookies.get(User.LinkNewOAuthCookieName)?.value;

				if (loggedInUser.user && linkNewOAuth) {
					const existingUser = yield* sdk.GET.users.byId(loggedInUser.user.id);

					if (existingUser) {
						yield* sdk.AUTH.oAuth.create({
							userId: existingUser.id,
							provider: ProviderID,
							providerUserId: auth0UserId,
						});

						const isEmailAccountVerified = yield* verifyEmail.isEmailVerified(existingUser);

						// If Mailer is enabled, is the user verified?
						if (!isEmailAccountVerified) {
							return new Response('Email not verified, please verify your account first.', {
								status: 400,
							});
						}

						yield* sessionHelper.createUserSession(existingUser.id, context);

						return redirect(context.locals.routeMap.mainLinks.dashboardIndex);
					}
				}

				const newUser = yield* userLib.createOAuthUser(
					{
						// @ts-expect-error drizzle broke the id variable...
						id: crypto.randomUUID(),
						username: auth0Username,
						name: auth0User.name,
						email: auth0User.email,
						avatar: auth0User.picture,
						createdAt: new Date(),
					},
					{ provider: ProviderID, providerUserId: auth0UserId }
				);

				if ('error' in newUser) {
					return new Response('Error creating user', { status: 500 });
				}

				// FIRST-TIME-SETUP
				if (config.dbStartPage) {
					return redirect('/done');
				}

				yield* verifyEmail.sendVerificationEmail(newUser.id, true);

				const existingUser = yield* sdk.GET.users.byId(newUser.id);

				const isEmailAccountVerified = yield* verifyEmail.isEmailVerified(existingUser);

				// If Mailer is enabled, is the user verified?
				if (!isEmailAccountVerified) {
					return new Response('Email not verified, please verify your account first.', {
						status: 400,
					});
				}

				yield* sessionHelper.createUserSession(newUser.id, context);

				return redirect(context.locals.routeMap.mainLinks.dashboardIndex);
			});

		return {
			initSession,
			initCallback,
		};
	}),
	dependencies: [Session.Default, SDKCore.Default, VerifyEmail.Default, User.Default],
}) {
	static Provide = Effect.provide(this.Default);
}
