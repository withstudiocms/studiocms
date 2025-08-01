import { getSecret } from 'astro:env/server';
import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import config from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import { FetchHttpClient, HttpClient, HttpClientResponse } from '@effect/platform';
import { Discord, generateCodeVerifier, generateState } from 'arctic';
import type { APIContext } from 'astro';
import { AstroError } from 'astro/errors';
import { Data, Effect, genLogger, Schema } from 'studiocms/effect';

/**
 * Represents a Discord user's profile information.
 *
 * @property id - The unique identifier for the Discord user.
 * @property avatar - The user's avatar hash.
 * @property username - The user's Discord username.
 * @property global_name - The user's global display name.
 * @property email - The user's email address.
 */
export class DiscordUser extends Schema.Class<DiscordUser>('DiscordUser')({
	id: Schema.String,
	avatar: Schema.String,
	username: Schema.String,
	global_name: Schema.String,
	email: Schema.String,
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

const DISCORD = {
	CLIENT_ID: getSecret('DISCORD_CLIENT_ID') ?? '',
	CLIENT_SECRET: getSecret('DISCORD_CLIENT_SECRET') ?? '',
	REDIRECT_URI: getSecret('DISCORD_REDIRECT_URI') ?? '',
}

/**
 * Provides Discord OAuth authentication effects for the StudioCMS API.
 *
 * This service handles the OAuth flow for Discord, including:
 * - Initializing the OAuth session and redirecting to Discord's authorization URL.
 * - Validating the authorization code returned by Discord.
 * - Handling the callback to link or create users based on Discord account information.
 * - Verifying user email status and creating user sessions.
 *
 * @remarks
 * - Integrates with session management, user library, and email verification services.
 * - Supports linking Discord accounts to existing users and creating new users via OAuth.
 * - Ensures email verification before allowing access to the dashboard.
 *
 * @example
 * ```typescript
 * const discordAuth = yield* DiscordOAuthAPI;
 * yield* discordAuth.initSession(context);
 * yield* discordAuth.initCallback(context);
 * ```
 *
 * @dependencies
 * - Session.Default
 * - SDKCore.Default
 * - VerifyEmail.Default
 * - User.Default
 */
export class DiscordOAuthAPI extends Effect.Service<DiscordOAuthAPI>()('DiscordOAuthAPI', {
	dependencies: [Session.Default, VerifyEmail.Default, User.Default, FetchHttpClient.layer],
	effect: genLogger('studiocms/routes/api/auth/discord/effect')(function* () {
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

		const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = DISCORD;

		const discord = new Discord(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

		const validateAuthCode = (code: string, codeVerifier: string) =>
			genLogger('studiocms/routes/api/auth/discord/effect.validateAuthCode')(function* () {
				const tokens = yield* Effect.tryPromise(() =>
					discord.validateAuthorizationCode(code, codeVerifier)
				);

				return yield* fetchClient
					.get('https://discord.com/api/users/@me', {
						headers: {
							Authorization: `Bearer ${tokens.accessToken}`,
						},
					})
					.pipe(
						Effect.flatMap(HttpClientResponse.schemaBodyJson(DiscordUser)),
						Effect.catchAll((error) =>
							Effect.fail(
								new ValidateAuthCodeError({
									provider: DiscordOAuthAPI.ProviderID,
									message: `Failed to fetch user info: ${error.message}`,
								})
							)
						)
					);
			});

		return {
			initSession: (context: APIContext) =>
				genLogger('studiocms/routes/api/auth/discord/effect.initSession')(function* () {
					const state = generateState();
					const codeVerifier = generateCodeVerifier();
					const scopes = ['identify', 'email'];

					const url = discord.createAuthorizationURL(state, codeVerifier, scopes);

					yield* setOAuthSessionTokenCookie(context, DiscordOAuthAPI.ProviderCookieName, state);

					yield* setOAuthSessionTokenCookie(
						context,
						DiscordOAuthAPI.ProviderCodeVerifier,
						codeVerifier
					);

					return context.redirect(url.toString());
				}),
			initCallback: (context: APIContext) =>
				genLogger('studiocms/routes/api/auth/discord/effect.initCallback')(function* () {
					const { cookies, redirect } = context;

					const [code, state, storedState, codeVerifier] = yield* Effect.all([
						getUrlParam(context, 'code'),
						getUrlParam(context, 'state'),
						getCookie(context, DiscordOAuthAPI.ProviderCookieName),
						getCookie(context, DiscordOAuthAPI.ProviderCodeVerifier),
					]);

					if (!code || !storedState || !codeVerifier || state !== storedState) {
						return redirect(StudioCMSRoutes.authLinks.loginURL);
					}

					const discordUser = yield* validateAuthCode(code, codeVerifier);

					const { id: discordUserId, username: discordUsername } = discordUser;

					const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId(
						DiscordOAuthAPI.ProviderID,
						discordUserId
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
								provider: DiscordOAuthAPI.ProviderID,
								providerUserId: discordUserId,
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

					const avatar_url = `https://cdn.discordapp.com/avatars/${discordUserId}/${discordUser.avatar}.png`;

					const newUser = yield* createOAuthUser(
						{
							// @ts-expect-error drizzle broke the id variable...
							id: crypto.randomUUID(),
							username: discordUsername,
							name: discordUser.global_name ?? discordUsername,
							email: discordUser.email,
							avatar: avatar_url,
							createdAt: new Date(),
						},
						{ provider: DiscordOAuthAPI.ProviderID, providerUserId: discordUserId }
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
	static ProviderID = 'discord';
	static ProviderCookieName = 'discord_oauth_state';
	static ProviderCodeVerifier = 'discord_oauth_code_verifier';
}
