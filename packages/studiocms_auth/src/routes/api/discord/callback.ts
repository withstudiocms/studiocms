import { logger } from '@it-astro:logger:studiocms-auth';
import { and, db, eq } from 'astro:db';
import { createUserSession } from 'studiocms:auth/lib/session';
import { LinkNewOAuthCookieName, createOAuthUser, getUserData } from 'studiocms:auth/lib/user';
import { StudioCMSRoutes } from 'studiocms:lib';
import { tsOAuthAccounts, tsUsers } from '@studiocms/core/sdk-utils/tables';
import { OAuth2RequestError, type OAuth2Tokens } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
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

			await createUserSession(user.id, context);

			return redirect(dashboardIndex);
		}

		const loggedInUser = await getUserData(context);
		const linkNewOAuth = !!cookies.get(LinkNewOAuthCookieName)?.value;

		if (loggedInUser.user && linkNewOAuth) {
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

				await createUserSession(existingUser.id, context);

				return redirect(dashboardIndex);
			}
		}

		const avatar_url = `https://cdn.discordapp.com/avatars/${discordUserId}/${discordUser.avatar}.png`;

		const newUser = await createOAuthUser(
			{
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

		await createUserSession(newUser.id, context);

		return redirect(dashboardIndex);
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			const code = e.code;
			logger.error(`OAuth2RequestError in Discord OAuth callback: ${code}`);
			return new Response(code, {
				status: 400,
			});
		}
		logger.error(`Unexpected error in Discord OAuth callback: ${e}`);
		return new Response(null, {
			status: 500,
		});
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET',
			'ALLOW-ACCESS-CONTROL-ORIGIN': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
