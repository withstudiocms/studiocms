// @ts-nocheck
import { setOAuthSessionTokenCookie } from 'studiocms:auth/lib/session';
import { generateCodeVerifier, generateState } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import { ProviderCodeVerifier, ProviderCookieName, google } from './shared';

export const GET: APIRoute = async (context: APIContext) => {
	const state = generateState();

	const codeVerifier = generateCodeVerifier();

	const scopes = ['profile', 'email'];

	const url = google.createAuthorizationURL(state, codeVerifier, scopes);

	setOAuthSessionTokenCookie(context, ProviderCookieName, state);

	setOAuthSessionTokenCookie(context, ProviderCodeVerifier, codeVerifier);

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
