import { createUserSession } from 'studiocms:auth/lib/session';
import { LinkNewOAuthCookieName, createOAuthUser, getUserData } from 'studiocms:auth/lib/user';
import { isEmailVerified, sendVerificationEmail } from 'studiocms:auth/lib/verify-email';
import { config } from 'studiocms:config';
import { StudioCMSRoutes } from 'studiocms:lib';
import studioCMS_SDK from 'studiocms:sdk';
import { OAuth2RequestError, type OAuth2Tokens } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import {
	type Auth0User,
	ProviderCodeVerifier,
	ProviderCookieName,
	ProviderID,
	auth0,
	getClientDomain,
} from './shared.js';

export const GET: APIRoute = async (context: APIContext): Promise<Response> => {
	const { url, cookies, redirect } = context;

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const codeVerifier = cookies.get(ProviderCodeVerifier)?.value ?? null;
	const storedState = cookies.get(ProviderCookieName)?.value ?? null;

	const CLIENT_DOMAIN = getClientDomain();

	if (!code || !codeVerifier || !storedState || state !== storedState) {
		return redirect(StudioCMSRoutes.authLinks.loginURL);
	}

	let tokens: OAuth2Tokens;

	try {
		tokens = await auth0.validateAuthorizationCode(code, codeVerifier);

		const auth0Response = await fetch(`${CLIENT_DOMAIN}/userinfo`, {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`,
			},
		});

		const auth0User: Auth0User = await auth0Response.json();
		const auth0UserId = auth0User.sub;
		const auth0Username = auth0User.nickname;

		const existingOAuthAccount = await studioCMS_SDK.AUTH.oAuth.searchProvidersForId(
			ProviderID,
			auth0UserId
		);

		if (existingOAuthAccount) {
			const user = await studioCMS_SDK.GET.databaseEntry.users.byId(existingOAuthAccount.userId);

			if (!user) {
				return new Response('User not found', {
					status: 404,
				});
			}

			const existingUser = await studioCMS_SDK.GET.databaseEntry.users.byId(user.id);

			const isEmailAccountVerified = await isEmailVerified(existingUser);

			// If Mailer is enabled, is the user verified?
			if (!isEmailAccountVerified) {
				return new Response('Email not verified, please verify your account first.', {
					status: 400,
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
					providerUserId: auth0UserId,
				});

				const isEmailAccountVerified = await isEmailVerified(existingUser);

				// If Mailer is enabled, is the user verified?
				if (!isEmailAccountVerified) {
					return new Response('Email not verified, please verify your account first.', {
						status: 400,
					});
				}

				await createUserSession(existingUser.id, context);

				return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
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

		// FIRST-TIME-SETUP
		if (config.dbStartPage) {
			return redirect('/done');
		}

		await sendVerificationEmail(newUser.id, true);

		const existingUser = await studioCMS_SDK.GET.databaseEntry.users.byId(newUser.id);

		const isEmailAccountVerified = await isEmailVerified(existingUser);

		// If Mailer is enabled, is the user verified?
		if (!isEmailAccountVerified) {
			return new Response('Email not verified, please verify your account first.', { status: 400 });
		}

		await createUserSession(newUser.id, context);

		return redirect(StudioCMSRoutes.mainLinks.dashboardIndex);
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			const code = e.code;
			return new Response(code, {
				status: 400,
			});
		}
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
