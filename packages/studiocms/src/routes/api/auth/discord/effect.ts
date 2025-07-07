import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import config, { AuthConfig } from 'studiocms:config';
import { SDKCore } from 'studiocms:sdk';
import { generateCodeVerifier, generateState } from 'arctic';
import { Discord } from 'arctic';
import type { APIContext } from 'astro';
import { Effect } from 'effect';
import { genLogger } from '../../../../lib/effects/index.js';

export const {
	DISCORD: { CLIENT_ID = '', CLIENT_SECRET = '', REDIRECT_URI = '' },
} = await authEnvCheck(AuthConfig.providers);

export const ProviderID = 'discord';
export const ProviderCookieName = 'discord_oauth_state';
export const ProviderCodeVerifier = 'discord_oauth_code_verifier';

export const discord = new Discord(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export interface DiscordUser {
	id: string;
	avatar: string;
	username: string;
	global_name: string;
	email: string;
}

export class DiscordOAuthAPI extends Effect.Service<DiscordOAuthAPI>()('DiscordOAuthAPI', {
	effect: genLogger('studiocms/routes/api/auth/discord/effect')(function* () {
		const sessionHelper = yield* Session;
		const sdk = yield* SDKCore;
		const verifyEmail = yield* VerifyEmail;
		const userLib = yield* User;

		const initSession = (context: APIContext) =>
			genLogger('studiocms/routes/api/auth/discord/effect.initSession')(function* () {
				const state = generateState();

				const codeVerifier = generateCodeVerifier();

				const scopes = ['identify', 'email'];

				const url = discord.createAuthorizationURL(state, codeVerifier, scopes);

				yield* sessionHelper.setOAuthSessionTokenCookie(context, ProviderCookieName, state);

				yield* sessionHelper.setOAuthSessionTokenCookie(
					context,
					ProviderCodeVerifier,
					codeVerifier
				);

				return context.redirect(url.toString());
			});

		const validateAuthCode = (code: string, codeVerifier: string) =>
			genLogger('studiocms/routes/api/auth/discord/effect.validateAuthCode')(function* () {
				const tokens = yield* Effect.tryPromise(() =>
					discord.validateAuthorizationCode(code, codeVerifier)
				);

				const response = yield* Effect.tryPromise(() =>
					fetch('https://discord.com/api/users/@me', {
						headers: {
							Authorization: `Bearer ${tokens.accessToken}`,
						},
					})
				);

				if (!response.ok) {
					yield* Effect.fail(new Error('Failed Authorization Check'));
				}

				const resData: DiscordUser = yield* Effect.tryPromise(() => response.json());

				return resData;
			});

		const initCallback = (context: APIContext) =>
			genLogger('studiocms/routes/api/auth/discord/effect.initCallback')(function* () {
				const { url, cookies, redirect } = context;

				const code = url.searchParams.get('code');
				const state = url.searchParams.get('state');
				const codeVerifier = cookies.get(ProviderCodeVerifier)?.value ?? null;
				const storedState = cookies.get(ProviderCookieName)?.value ?? null;

				if (!code || !storedState || !codeVerifier || state !== storedState) {
					return redirect(context.locals.routeMap.authLinks.loginURL);
				}

				const discordUser = yield* validateAuthCode(code, codeVerifier);

				const { id: discordUserId, username: discordUsername } = discordUser;

				const existingOAuthAccount = yield* sdk.AUTH.oAuth.searchProvidersForId(
					ProviderID,
					discordUserId
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
							providerUserId: discordUserId,
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

				const avatar_url = `https://cdn.discordapp.com/avatars/${discordUserId}/${discordUser.avatar}.png`;

				const newUser = yield* userLib.createOAuthUser(
					{
						// @ts-expect-error drizzle broke the id variable...
						id: crypto.randomUUID(),
						username: discordUsername,
						name: discordUser.global_name ?? discordUsername,
						email: discordUser.email,
						avatar: avatar_url,
						createdAt: new Date(),
					},
					{ provider: ProviderID, providerUserId: discordUserId }
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
