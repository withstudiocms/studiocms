import { logger } from '@it-astro:logger:studiocms-auth';
import { and, db, eq } from 'astro:db';
import {
	createSession,
	generateSessionToken,
	makeExpirationDate,
	setSessionTokenCookie,
} from 'studiocms:auth/lib/session';
import { LinkNewOAuthCookieName, createOAuthUser, getUserData } from 'studiocms:auth/lib/user';
import { StudioCMSRoutes } from 'studiocms:helpers/routemap';
import { tsOAuthAccounts, tsUsers } from '@studiocms/core/db/tsTables';
import { OAuth2RequestError, type OAuth2Tokens } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import { type GitHubUser, ProviderCookieName, ProviderID, github } from './shared';

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
		tokens = await github.validateAuthorizationCode(code);

		const githubUserResponse = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`,
			},
		});

		const githubUser: GitHubUser = await githubUserResponse.json();
		const githubUserId = githubUser.id;
		const githubUsername = githubUser.login;

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
					eq(tsOAuthAccounts.providerUserId, `${githubUserId}`)
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
					providerUserId: `${githubUserId}`,
					userId: existingUser.id,
				});

				const sessionToken = generateSessionToken();
				await createSession(sessionToken, existingUser.id);
				setSessionTokenCookie(context, sessionToken, makeExpirationDate());

				return redirect(dashboardIndex);
			}
		}

		const newUser = await createOAuthUser(
			{
				id: crypto.randomUUID(),
				username: githubUsername,
				email: githubUser.email,
				name: githubUser.name,
				avatar: githubUser.avatar_url,
				createdAt: new Date(),
				url: githubUser.blog,
			},
			{ provider: ProviderID, providerUserId: `${githubUserId}` }
		);

		if ('error' in newUser) {
			return new Response('Error creating user', { status: 500 });
		}

		const sessionToken = generateSessionToken();
		await createSession(sessionToken, newUser.id);
		setSessionTokenCookie(context, sessionToken, makeExpirationDate());

		return redirect(dashboardIndex);
	} catch (e) {
		if (e instanceof OAuth2RequestError) {
			const code = e.code;
			logger.error(`OAuth2RequestError in GitHub OAuth callback: ${code}`);
			return new Response(code, {
				status: 400,
			});
		}
		logger.error(`Unexpected error in GitHub OAuth callback: ${e}`);
		return new Response(null, {
			status: 400,
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
