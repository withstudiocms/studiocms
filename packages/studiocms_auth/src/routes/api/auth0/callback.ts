import { logger } from '@it-astro:logger:studiocms-auth';
import { and, db, eq } from 'astro:db';
import { createUserSession } from 'studiocms:auth/lib/session';
import { LinkNewOAuthCookieName, createOAuthUser, getUserData } from 'studiocms:auth/lib/user';
import { StudioCMSRoutes } from 'studiocms:helpers/routemap';
import { tsOAuthAccounts, tsUsers } from '@studiocms/core/db/tsTables';
import { OAuth2RequestError, type OAuth2Tokens } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import { type Auth0User, ProviderCookieName, ProviderID, auth0, getClientDomain } from './shared';

const {
	authLinks: { loginURL },
	mainLinks: { dashboardIndex },
} = StudioCMSRoutes;

export const GET: APIRoute = async (context: APIContext): Promise<Response> => {
	const { url, cookies, redirect } = context;

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get(ProviderCookieName)?.value ?? null;

	const CLIENT_DOMAIN = getClientDomain();

	if (!code || !state || !storedState || state !== storedState) {
		return redirect(loginURL);
	}

	let tokens: OAuth2Tokens;

	try {
		tokens = await auth0.validateAuthorizationCode(code);

		const auth0Response = await fetch(`${CLIENT_DOMAIN}/userinfo`, {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`,
			},
		});

		const auth0User: Auth0User = await auth0Response.json();
		const auth0UserId = auth0User.sub;
		const auth0Username = auth0User.nickname;

		// FIRST-TIME-SETUP
		// if (STUDIOCMS_FIRST_TIME_SETUP) {
		// 	// TODO: Add first-time setup logic here
		// }

		const existingoAuthAccount = await db
			.select()
			.from(tsOAuthAccounts)
			.where(
				and(
					eq(tsOAuthAccounts.provider, ProviderID),
					eq(tsOAuthAccounts.providerUserId, auth0UserId)
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
			const exisitingUser = await db
				.select()
				.from(tsUsers)
				.where(eq(tsUsers.id, loggedInUser.user.id))
				.get();

			if (exisitingUser) {
				await db.insert(tsOAuthAccounts).values({
					provider: ProviderID,
					providerUserId: auth0UserId,
					userId: exisitingUser.id,
				});

				await createUserSession(exisitingUser.id, context);

				return redirect(dashboardIndex);
			}
		}

		const newUser = await createOAuthUser(
			{
				id: crypto.randomUUID(),
				username: auth0Username,
				name: auth0User.name,
				email: auth0User.email,
				avatar: auth0User.picture,
				createdAt: new Date(),
			},
			{ provider: ProviderID, providerUserId: auth0UserId }
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
			logger.error(`OAuth2RequestError in Auth0 OAuth callback: ${code}`);
			return new Response(code, {
				status: 400,
			});
		}
		logger.error(`Unexpected error in Auth0 OAuth callback: ${e}`);
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
