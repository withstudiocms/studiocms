// @ts-nocheck
import { logger } from '@it-astro:logger:studiocms-auth';
import { createUserSession } from 'studiocms:auth/lib/session';
import { LinkNewOAuthCookieName, createOAuthUser, getUserData } from 'studiocms:auth/lib/user';
import { StudioCMSRoutes } from 'studiocms:lib';
import studioCMS_SDK from 'studiocms:sdk';
import { OAuth2RequestError, type OAuth2Tokens } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import { type DiscordUser, ProviderCookieName, ProviderID, discord } from './shared';

export const GET: APIRoute = async (context: APIContext): Promise<Response> => {
	const { url, cookies, redirect } = context;

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get(ProviderCookieName)?.value ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		return redirect(StudioCMSRoutes.authLinks.loginURL);
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

		const existingOAuthAccount = await studioCMS_SDK.AUTH.oAuth.searchProvidersForId(
			ProviderID,
			discordUserId
		);

		if (existingOAuthAccount) {
			const user = await studioCMS_SDK.GET.databaseEntry.users.byId(existingOAuthAccount.userId);

			if (!user) {
				return new Response('User not found', {
					status: 404,
				});
			}

			await createUserSession(user.id, context);

			return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
		}

		const loggedInUser = await getUserData(context);
		const linkNewOAuth = !!cookies.get(LinkNewOAuthCookieName)?.value;

		if (loggedInUser.user && linkNewOAuth) {
			const existingUser = await studioCMS_SDK.GET.databaseEntry.users.byId(loggedInUser.user.id);

			if (existingUser) {
				await studioCMS_SDK.AUTH.oAuth.create({
					userId: existingUser.id,
					provider: ProviderID,
					providerUserId: discordUserId,
				});

				await createUserSession(existingUser.id, context);

				return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
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

		// FIRST-TIME-SETUP
		if (config.dbStartPage) {
			return redirect('/done');
		}

		await createUserSession(newUser.id, context);

		return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
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
