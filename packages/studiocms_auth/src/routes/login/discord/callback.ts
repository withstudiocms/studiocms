import { and, db, eq } from 'astro:db';
import { StudioCMSRoutes } from 'studiocms:helpers/routemap';
import { tsOAuthAccounts, tsUsers } from '@studiocms/core/db/tsTables';
import { OAuth2RequestError, type OAuth2Tokens } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import {
	createSession,
	generateSessionToken,
	makeExpirationDate,
	setSessionTokenCookie,
} from '../../../lib/session';
import { getUserData } from '../../../lib/user';
import { type DiscordUser, ProviderCookieName, ProviderID, discord } from './shared';

const {
	authLinks: { loginURL },
	mainLinks: { dashboardIndex },
} = StudioCMSRoutes;

export const GET: APIRoute = async (context: APIContext): Promise<Response> => {
	const { url, cookies, redirect } = context;

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get(ProviderCookieName)?.value ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		return redirect(loginURL);
	}

	let tokens: OAuth2Tokens;

	try {
		tokens = await discord.validateAuthorizationCode(code);

		const discordResponse = await fetch('https://discord.com/api/users/@me', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`,
			},
		});

		const discordUser: DiscordUser = await discordResponse.json();
		const discordUserId = discordUser.id;
		const discordUsername = discordUser.username;

		// FIRST-TIME-SETUP
		// if (STUDIOCMS_FIRST_TIME_SETUP) {
		//  // TODO: Add first-time setup logic here
		// }

		const existingoAuthAccount = await db
			.select()
			.from(tsOAuthAccounts)
			.where(
				and(
					eq(tsOAuthAccounts.provider, ProviderID),
					eq(tsOAuthAccounts.providerUserId, discordUserId)
				)
			)
			.get();

		if (existingoAuthAccount) {
			const user = await db
				.select()
				.from(tsUsers)
				.where(eq(tsUsers.id, existingoAuthAccount.userId))
				.get();

			if (!user) {
				return new Response('User not found', {
					status: 404,
				});
			}

			const sessionToken = generateSessionToken();
			await createSession(sessionToken, user.id);
			setSessionTokenCookie(context, sessionToken, makeExpirationDate());

			return redirect(dashboardIndex);
		}

		const loggedInUser = await getUserData(context);

		if (loggedInUser.user) {
			const existingUser = await db
				.select()
				.from(tsUsers)
				.where(eq(tsUsers.id, loggedInUser.user.id))
				.get();

			if (existingUser) {
				await db.insert(tsOAuthAccounts).values({
					provider: ProviderID,
					providerUserId: discordUserId,
					userId: existingUser.id,
				});

				const sessionToken = generateSessionToken();
				await createSession(sessionToken, existingUser.id);
				setSessionTokenCookie(context, sessionToken, makeExpirationDate());

				return redirect(dashboardIndex);
			}
		}

		const avatar_url = `https://cdn.discordapp.com/avatars/${discordUserId}/${discordUser.avatar}.png`;

		const newUser = await db
			.insert(tsUsers)
			.values({
				id: crypto.randomUUID(),
				username: discordUsername,
				name: discordUser.global_name ?? discordUsername,
				email: discordUser.email,
				avatar: avatar_url,
				createdAt: new Date(),
			})
			.returning()
			.get();

		const newOAuthAccount = await db
			.insert(tsOAuthAccounts)
			.values({
				provider: ProviderID,
				providerUserId: discordUserId,
				userId: newUser.id,
			})
			.returning()
			.get();

		const sessionToken = generateSessionToken();
		await createSession(sessionToken, newOAuthAccount.userId);
		setSessionTokenCookie(context, sessionToken, makeExpirationDate());

		return redirect(dashboardIndex);
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400,
			});
		}
		console.error(e);
		return new Response(null, {
			status: 500,
		});
	}
};
