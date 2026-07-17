import { getSecret } from 'astro:env/server';
import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { StudioCMSRoutes } from 'studiocms:lib';
import { SDKCore } from 'studiocms:sdk';
import { Discord, generateCodeVerifier, generateState } from 'arctic';
import type { APIContext } from 'astro';
import { Effect, genLogger, Platform, Schema } from 'studiocms/effect';
import { getCookie, getUrlParam, ValidateAuthCodeError } from 'studiocms/oAuthUtils';
import {
	handleExistingOAuthAccount,
	handleNewOAuthUser,
	handleOAuthLinking,
} from '../shared.js';

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

const DISCORD = {
	CLIENT_ID: getSecret('CMS_DISCORD_CLIENT_ID') ?? '',
	CLIENT_SECRET: getSecret('CMS_DISCORD_CLIENT_SECRET') ?? '',
	REDIRECT_URI: getSecret('CMS_DISCORD_REDIRECT_URI') ?? '',
};

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
	dependencies: [VerifyEmail.Default, Platform.FetchHttpClient.layer],
	effect: genLogger('studiocms/routes/api/auth/discord/effect')(function* () {
		const [sdk, fetchClient, { setOAuthSessionTokenCookie }, { createOAuthUser }] =
			yield* Effect.all([SDKCore, Platform.HttpClient.HttpClient, Session, User]);

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
						Effect.flatMap(Platform.HttpClientResponse.schemaBodyJson(DiscordUser)),
						Effect.mapError(
							(error) =>
								new ValidateAuthCodeError({
									provider: DiscordOAuthAPI.ProviderID,
									message: `Failed to fetch user info: ${error.message}`,
								})
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
					const { redirect } = context;

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

					const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId({
						providerId: DiscordOAuthAPI.ProviderID,
						userId: discordUserId,
					});

					if (existingOAuthAccount) {
						return yield* handleExistingOAuthAccount(context, existingOAuthAccount).pipe(Effect.provide(VerifyEmail.Default));
					}

					const linkResult = yield* handleOAuthLinking(
						context,
						DiscordOAuthAPI.ProviderID,
						discordUserId
					).pipe(Effect.provide(VerifyEmail.Default));
					if (linkResult) return linkResult;

					const avatar_url = `https://cdn.discordapp.com/avatars/${discordUserId}/${discordUser.avatar}.png`;

					const newUser = yield* createOAuthUser(
						{
							id: crypto.randomUUID(),
							username: discordUsername,
							name: discordUser.global_name ?? discordUsername,
							email: discordUser.email,
							avatar: avatar_url,
							createdAt: new Date().toISOString(),
							emailVerified: false,
							notifications: null,
							password: null,
							updatedAt: new Date().toISOString(),
							url: null,
						},
						{ provider: DiscordOAuthAPI.ProviderID, providerUserId: discordUserId }
					);

					return yield* handleNewOAuthUser(context, newUser).pipe(Effect.provide(VerifyEmail.Default));
				}),
		};
	}),
}) {
	static ProviderID = 'discord';
	static ProviderCookieName = 'discord_oauth_state';
	static ProviderCodeVerifier = 'discord_oauth_code_verifier';
}
