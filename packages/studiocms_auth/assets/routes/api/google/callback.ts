// @ts-nocheck
import { logger } from '@it-astro:logger:studiocms-auth';
import { createUserSession } from 'studiocms:auth/lib/session';
import { LinkNewOAuthCookieName, createOAuthUser, getUserData } from 'studiocms:auth/lib/user';
import { StudioCMSRoutes } from 'studiocms:lib';
import studioCMS_SDK from 'studiocms:sdk';
import { OAuth2RequestError, type OAuth2Tokens } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import {
	type GoogleUser,
	ProviderCodeVerifier,
	ProviderCookieName,
	ProviderID,
	google,
} from './shared';

export const GET: APIRoute = async (context: APIContext): Promise<Response> => {
	const { url, cookies, redirect } = context;

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const codeVerifier = cookies.get(ProviderCodeVerifier)?.value ?? null;
	const storedState = cookies.get(ProviderCookieName)?.value ?? null;

	if (!code || !storedState || !codeVerifier || state !== storedState) {
		return redirect(StudioCMSRoutes.authLinks.loginURL);
	}

	let tokens: OAuth2Tokens;

	try {
		tokens = await google.validateAuthorizationCode(code, codeVerifier);

		const googleUserResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`,
			},
		});

		const googleUser: GoogleUser = await googleUserResponse.json();
		const googleUserId = googleUser.sub;
		const googleUsername = googleUser.name;

		// FIRST-TIME-SETUP
		// if (STUDIOCMS_FIRST_TIME_SETUP) {
		//  // TODO: Add first-time setup logic
		// }

		const existingOAuthAccount = await studioCMS_SDK.AUTH.oAuth.searchProvidersForId(
			ProviderID,
			googleUserId
		);

		if (existingOAuthAccount) {
			const user = await studioCMS_SDK.GET.databaseEntry.users.byId(existingOAuthAccount.userId);

			if (!user) {
				return new Response('User not found', { status: 404 });
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
					providerUserId: googleUserId,
				});

				await createUserSession(existingUser.id, context);

				return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
			}
		}

		const newUser = await createOAuthUser(
			{
				id: crypto.randomUUID(),
				username: googleUsername,
				email: googleUser.email,
				name: googleUser.name,
				avatar: googleUser.picture,
				createdAt: new Date(),
			},
			{ provider: ProviderID, providerUserId: googleUserId }
		);

		if ('error' in newUser) {
			return new Response('Error creating user', { status: 500 });
		}

		await createUserSession(newUser.id, context);

		return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			const code = e.code;
			logger.error(`OAuth2RequestError in Google OAuth callback: ${code}`);
			return new Response(code, {
				status: 400,
			});
		}
		logger.error(`Unexpected error in Google OAuth callback: ${e}`);
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
