// @ts-nocheck
import {
	deleteSessionTokenCookie,
	invalidateSession,
	sessionCookieName,
	validateSessionToken,
} from 'studiocms:auth/lib/session';
import { StudioCMSRoutes } from 'studiocms:lib';
import type { APIContext, APIRoute } from 'astro';

export const GET: APIRoute = async (context: APIContext): Promise<Response> => {
	return POST(context);
};

export const POST: APIRoute = async (context: APIContext): Promise<Response> => {
	const { cookies, redirect } = context;

	// Get the current session cookie
	const sessionToken = cookies.get(sessionCookieName)?.value ?? null;

	// If there is no session token, redirect to the login page
	if (!sessionToken) {
		return redirect(StudioCMSRoutes.authLinks.loginURL);
	}

	const { session, user } = await validateSessionToken(sessionToken);

	// If there is no session, redirect to the login page
	if (session === null) {
		deleteSessionTokenCookie(context);
		return redirect(StudioCMSRoutes.authLinks.loginURL);
	}

	// If there is no user, redirect to the login page
	if (!user || user === null) {
		return redirect(StudioCMSRoutes.authLinks.loginURL);
	}

	// Invalidate the session and delete the session token cookie
	await invalidateSession(user.id);
	deleteSessionTokenCookie(context);

	// Redirect to the base site URL
	return redirect(StudioCMSRoutes.mainLinks.baseSiteURL);
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, POST',
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
