import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import config, { AuthConfig } from 'studiocms:config';
import { SDKCore } from 'studiocms:sdk';
import { generateState } from 'arctic';
import { GitHub } from 'arctic';
import type { APIContext } from 'astro';
import { Effect } from 'effect';
import { genLogger } from '../../../../lib/effects/index.js';

const {
	GITHUB: { CLIENT_ID = '', CLIENT_SECRET = '', REDIRECT_URI = null },
} = await authEnvCheck(AuthConfig.providers);

export const ProviderID = 'github';
export const ProviderCookieName = 'github_oauth_state';

export const github = new GitHub(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export interface GitHubUser {
	id: number;
	html_url: string;
	login: string;
	avatar_url: string;
	name: string;
	blog: string;
	email: string;
}

export class GitHubOAuthAPI extends Effect.Service<GitHubOAuthAPI>()('GitHubOAuthAPI', {
	effect: genLogger('studiocms/routes/api/auth/github/effect')(function* () {
		const sessionHelper = yield* Session;
		const sdk = yield* SDKCore;
		const verifyEmail = yield* VerifyEmail;
		const userLib = yield* User;

		const initSession = (context: APIContext) =>
			genLogger('studiocms/routes/api/auth/github/effect.initSession')(function* () {
				const state = generateState();

				const scopes = ['user:email', 'repo'];

				const url = github.createAuthorizationURL(state, scopes);

				yield* sessionHelper.setOAuthSessionTokenCookie(context, ProviderCookieName, state);

				return context.redirect(url.toString());
			});

		const validateAuthCode = (code: string) =>
			genLogger('studiocms/routes/api/auth/github/effect.validateAuthCode')(function* () {
				const tokens = yield* Effect.tryPromise(() => github.validateAuthorizationCode(code));

				const response = yield* Effect.tryPromise(() =>
					fetch('https://api.github.com/user', {
						headers: {
							Authorization: `Bearer ${tokens.accessToken}`,
						},
					})
				);

				if (!response.ok) {
					yield* Effect.fail(new Error('Failed Authorization Check'));
				}

				const resData: GitHubUser = yield* Effect.tryPromise(() => response.json());

				return resData;
			});

		const initCallback = (context: APIContext) =>
			genLogger('studiocms/routes/api/auth/github/effect.initCallback')(function* () {
				const { url, cookies, redirect } = context;

				const code = url.searchParams.get('code');
				const state = url.searchParams.get('state');
				const storedState = cookies.get(ProviderCookieName)?.value ?? null;

				if (!code || !state || !storedState || state !== storedState) {
					return redirect(context.locals.routeMap.authLinks.loginURL);
				}

				const githubUser = yield* validateAuthCode(code);

				const { id: githubUserId, login: githubUsername } = githubUser;

				const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId(
					ProviderID,
					`${githubUserId}`
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
							providerUserId: `${githubUserId}`,
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
						username: githubUsername,
						email: githubUser.email,
						name: githubUser.name,
						avatar: githubUser.avatar_url,
						createdAt: new Date(),
						url: githubUser.blog,
					},
					{ provider: ProviderID, providerUserId: `${githubUserId}` }
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
			initCallback
		};
	}),
	dependencies: [Session.Default, SDKCore.Default, VerifyEmail.Default, User.Default],
}) {
	static Provide = Effect.provide(this.Default);
}
