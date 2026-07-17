import { getSecret } from 'astro:env/server';
import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import { GitHub, generateState } from 'arctic';
import { Effect, genLogger, Platform, Schema } from 'studiocms/effect';
import { getCookie, getUrlParam, ValidateAuthCodeError } from 'studiocms/oAuthUtils';
import { OAuthService } from '../service.js';
import { handleExistingOAuthAccount, handleNewOAuthUser, handleOAuthLinking } from '../shared.js';

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

export const ProviderID = 'github';
export const ProviderCookieName = 'github_oauth_state';

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
 * - Note: GitHub does not use PKCE (no code verifier).
 */
export const GitHubOAuthAPI = genLogger('@studiocms/oauth/github/impl')(function* () {
	const [sdk, fetchClient, { setOAuthSessionTokenCookie }, { createOAuthUser }] = yield* Effect.all(
		[SDKCore, Platform.HttpClient.HttpClient, Session, User]
	);

	const CLIENT_ID = getSecret('CMS_GITHUB_CLIENT_ID') ?? '';
	const CLIENT_SECRET = getSecret('CMS_GITHUB_CLIENT_SECRET') ?? '';
	const REDIRECT_URI = getSecret('CMS_GITHUB_REDIRECT_URI') ?? null;

	const github = new GitHub(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

	const validateAuthCode = (code: string) =>
		genLogger('@studiocms/oauth/github/impl.validateAuthCode')(function* () {
			const tokens = yield* Effect.tryPromise(() => github.validateAuthorizationCode(code));

			return yield* fetchClient
				.get('https://api.github.com/user', {
					headers: {
						Authorization: `Bearer ${tokens.accessToken}`,
					},
				})
				.pipe(
					Effect.flatMap(Platform.HttpClientResponse.schemaBodyJson(GitHubUser)),
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
			genLogger('@studiocms/oauth/github/impl.initSession')(function* () {
				const state = generateState();
				const scopes = ['user:email', 'repo'];
				const url = github.createAuthorizationURL(state, scopes);
				yield* setOAuthSessionTokenCookie(context, ProviderCookieName, state);
				return context.redirect(url.toString());
			}),
		initCallback: (context) =>
			genLogger('@studiocms/oauth/github/impl.initCallback')(function* () {
				const { redirect } = context;

				const [code, state, storedState] = yield* Effect.all([
					getUrlParam(context, 'code'),
					getUrlParam(context, 'state'),
					getCookie(context, ProviderCookieName),
				]);

				if (!code || !state || !storedState || state !== storedState) {
					return redirect(StudioCMSRoutes.authLinks.loginURL);
				}

				const githubUser = yield* validateAuthCode(code);

				// GitHub returns a numeric id; coerce to string for the OAuth provider API.
				const { id: githubUserId, login: githubUsername } = githubUser;
				const githubUserIdStr = `${githubUserId}`;

				const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId({
					providerId: ProviderID,
					userId: githubUserIdStr,
				});

				if (existingOAuthAccount) {
					return yield* handleExistingOAuthAccount(context, existingOAuthAccount);
				}

				const linkResult = yield* handleOAuthLinking(context, ProviderID, githubUserIdStr);
				if (linkResult) return linkResult;

				const newUser = yield* createOAuthUser(
					{
						id: crypto.randomUUID(),
						username: githubUsername,
						email: githubUser.email || null,
						name: githubUser.name || githubUsername,
						avatar: githubUser.avatar_url,
						createdAt: new Date().toISOString(),
						url: githubUser.blog || null,
						emailVerified: false,
						notifications: null,
						password: null,
						updatedAt: new Date().toISOString(),
					},
					{ provider: ProviderID, providerUserId: githubUserIdStr }
				);

				return yield* handleNewOAuthUser(context, newUser);
			}).pipe(Effect.provide(VerifyEmail.Default)),
	});
}).pipe(Effect.provide(Platform.FetchHttpClient.layer));
