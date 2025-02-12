import { setOAuthSessionTokenCookie } from 'studiocms:auth/lib/session';
import { generateState } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import { ProviderCookieName, auth0 } from './shared.js';

export const GET: APIRoute = async (context: APIContext) => {
	const state = generateState();

	const scopes = ['profile', 'email'];

	const url = auth0.createAuthorizationURL(state, scopes);

	setOAuthSessionTokenCookie(context, ProviderCookieName, state);

	return context.redirect(url.toString());
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
