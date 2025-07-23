import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import config from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import { FetchHttpClient, HttpClient, HttpClientResponse } from '@effect/platform';
import { generateState } from 'arctic';
import { GitHub } from 'arctic';
import type { APIContext } from 'astro';
import { Effect, genLogger } from '../../../../../effect.js';
import { AuthEnvCheck, Provider, ValidateAuthCodeError } from './_shared.js';
import { GitHubUser } from './_shared.js';

/**
 * Provides GitHub OAuth authentication effects for the StudioCMS API.
 *
 * This service handles the OAuth flow with GitHub, including:
 * - Initializing the OAuth session and redirecting users to GitHub for authorization.
 * - Validating the authorization code returned by GitHub and fetching user data.
 * - Handling the callback from GitHub, including:
 *   - Linking OAuth accounts to existing users.
 *   - Creating new users from GitHub profile data.
 *   - Verifying user email addresses.
 *   - Creating user sessions and redirecting to appropriate pages.
 *
 * @remarks
 * - Depends on session management, user library, email verification, and SDK core services.
 * - Handles both first-time setup and linking additional OAuth providers to existing accounts.
 *
 * @example
 * ```typescript
 * const githubOAuth = new GitHubOAuthAPI();
 * yield* githubOAuth.initSession(context);
 * yield* githubOAuth.initCallback(context);
 * ```
 *
 * @see {@link Session}
 * @see {@link SDKCore}
 * @see {@link VerifyEmail}
 * @see {@link User}
 */
export class GitHubOAuthAPI extends Effect.Service<GitHubOAuthAPI>()('GitHubOAuthAPI', {
	effect: genLogger('studiocms/routes/api/auth/github/effect')(function* () {
		const [
			sessionHelper,
			sdk,
			verifyEmail,
			userLib,
			fetchClient,
			{
				GITHUB: { CLIENT_ID = '', CLIENT_SECRET = '', REDIRECT_URI = null },
			},
		] = yield* Effect.all([
			Session,
			SDKCore,
			VerifyEmail,
			User,
			HttpClient.HttpClient,
			AuthEnvCheck,
		]);

		const github = new GitHub(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

		const validateAuthCode = (code: string) =>
			genLogger('studiocms/routes/api/auth/github/effect.validateAuthCode')(function* () {
				const tokens = yield* Effect.tryPromise(() => github.validateAuthorizationCode(code));

				return yield* fetchClient
					.get('https://api.github.com/user', {
						headers: {
							Authorization: `Bearer ${tokens.accessToken}`,
						},
					})
					.pipe(
						Effect.flatMap(HttpClientResponse.schemaBodyJson(GitHubUser)),
						Effect.catchAll((error) =>
							Effect.fail(
								new ValidateAuthCodeError({
									provider: GitHubOAuthAPI.ProviderID,
									message: `Failed to fetch user info: ${error.message}`,
								})
							)
						)
					);
			});

		return {
			initSession: (context: APIContext) =>
				genLogger('studiocms/routes/api/auth/github/effect.initSession')(function* () {
					const state = generateState();

					const scopes = ['user:email', 'repo'];

					const url = github.createAuthorizationURL(state, scopes);

					yield* sessionHelper.setOAuthSessionTokenCookie(
						context,
						GitHubOAuthAPI.ProviderCookieName,
						state
					);

					return context.redirect(url.toString());
				}),
			initCallback: (context: APIContext) =>
				genLogger('studiocms/routes/api/auth/github/effect.initCallback')(function* () {
					const { url, cookies, redirect } = context;

					const code = url.searchParams.get('code');
					const state = url.searchParams.get('state');
					const storedState = cookies.get(GitHubOAuthAPI.ProviderCookieName)?.value ?? null;

					if (!code || !state || !storedState || state !== storedState) {
						return redirect(StudioCMSRoutes.authLinks.loginURL);
					}

					const githubUser = yield* validateAuthCode(code);

					const { id: githubUserId, login: githubUsername } = githubUser;

					const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId(
						GitHubOAuthAPI.ProviderID,
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

						return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
					}

					const loggedInUser = yield* userLib.getUserData(context);
					const linkNewOAuth = !!cookies.get(User.LinkNewOAuthCookieName)?.value;

					if (loggedInUser.user && linkNewOAuth) {
						const existingUser = yield* sdk.GET.users.byId(loggedInUser.user.id);

						if (existingUser) {
							yield* sdk.AUTH.oAuth.create({
								userId: existingUser.id,
								provider: GitHubOAuthAPI.ProviderID,
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

							return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
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
						{ provider: GitHubOAuthAPI.ProviderID, providerUserId: `${githubUserId}` }
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

					return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
				}),
		};
	}),
	dependencies: [
		Session.Default,
		SDKCore.Default,
		VerifyEmail.Default,
		User.Default,
		FetchHttpClient.layer,
	],
}) {
	static ProviderID = Provider.GITHUB;
	static ProviderCookieName = 'github_oauth_state';
}
