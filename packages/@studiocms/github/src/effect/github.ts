import { getSecret } from 'astro:env/server';
import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import config from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import { FetchHttpClient, HttpClient, HttpClientResponse } from '@effect/platform';
import { GitHub, generateState } from 'arctic';
import type { APIContext } from 'astro';
import { AstroError } from 'astro/errors';
import { Data, Effect, genLogger, Schema } from 'studiocms/effect';

/**
 * Represents a GitHub user profile as returned by the GitHub API.
 *
 * @property id - The unique identifier for the user.
 * @property html_url - The URL to the user's GitHub profile.
 * @property login - The user's GitHub username.
 * @property avatar_url - The URL to the user's avatar image.
 * @property name - The user's display name.
 * @property blog - The user's blog URL.
 * @property email - The user's public email address.
 */
export class GitHubUser extends Schema.Class<GitHubUser>('GitHubUser')({
	id: Schema.Number,
	html_url: Schema.String,
	login: Schema.String,
	avatar_url: Schema.String,
	name: Schema.optional(Schema.String),
	blog: Schema.optional(Schema.String),
	email: Schema.optional(Schema.String),
}) {}

/**
 * Error class representing a failure during the validation of an authentication code.
 *
 * @extends Data.TaggedError
 * @property message - A descriptive error message explaining the cause of the failure.
 * @property provider - The authentication provider associated with the error (e.g., "auth0").
 */
export class ValidateAuthCodeError extends Data.TaggedError('ValidateAuthCodeError')<{
	message: string;
	provider: string;
}> {}

/**
 * Retrieves the value of a specified query parameter from the given API context's URL.
 *
 * @param context - The API context containing the URL to extract the parameter from.
 * @param name - The name of the query parameter to retrieve.
 * @returns An Effect that resolves to the value of the query parameter, or throws an AstroError if parsing fails.
 */
export const getUrlParam = ({ url }: APIContext, name: string) =>
	Effect.try({
		try: () => url.searchParams.get(name),
		catch: () => new AstroError('Failed to parse URL from Astro context'),
	});

/**
 * Retrieves the value of a cookie from the provided API context using the specified key.
 *
 * Wraps the retrieval in an Effect, returning the cookie value if found, or `null` if not present.
 * Throws an `AstroError` if there is a failure during the cookie retrieval process.
 *
 * @param context - The API context containing the cookies object.
 * @param key - The name of the cookie to retrieve.
 * @returns An Effect that resolves to the cookie value as a string, or `null` if not found.
 */
export const getCookie = ({ cookies }: APIContext, key: string) =>
	Effect.try({
		try: () => cookies.get(key)?.value ?? null,
		catch: () => new AstroError('Failed to parse get Cookies from Astro context'),
	});

const GITHUB = {
	CLIENT_ID: getSecret('GITHUB_CLIENT_ID') ?? '',
	CLIENT_SECRET: getSecret('GITHUB_CLIENT_SECRET') ?? '',
	REDIRECT_URI: getSecret('GITHUB_REDIRECT_URI') ?? null,
}

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
	dependencies: [Session.Default, VerifyEmail.Default, User.Default, FetchHttpClient.layer],
	effect: genLogger('studiocms/routes/api/auth/github/effect')(function* () {
		const [
			sdk,
			fetchClient,
			{ setOAuthSessionTokenCookie, createUserSession },
			{ isEmailVerified, sendVerificationEmail },
			{ getUserData, createOAuthUser },
		] = yield* Effect.all([
			SDKCore,
			HttpClient.HttpClient,
			Session,
			VerifyEmail,
			User,
		]);

		const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = GITHUB;

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

					yield* setOAuthSessionTokenCookie(context, GitHubOAuthAPI.ProviderCookieName, state);

					return context.redirect(url.toString());
				}),
			initCallback: (context: APIContext) =>
				genLogger('studiocms/routes/api/auth/github/effect.initCallback')(function* () {
					const { cookies, redirect } = context;

					const [code, state, storedState] = yield* Effect.all([
						getUrlParam(context, 'code'),
						getUrlParam(context, 'state'),
						getCookie(context, GitHubOAuthAPI.ProviderCookieName),
					]);

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
								provider: GitHubOAuthAPI.ProviderID,
								providerUserId: `${githubUserId}`,
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
							username: githubUsername,
							email: githubUser.email,
							name: githubUser.name || githubUsername,
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
	static ProviderID = 'github';
	static ProviderCookieName = 'github_oauth_state';
}
