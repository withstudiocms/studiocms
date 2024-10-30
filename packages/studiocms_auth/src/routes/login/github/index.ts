import { generateState } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import { setOAuthSessionTokenCookie } from '../../../lib/session';
import { ProviderCookieName, github } from './shared';

export const GET: APIRoute = async (context: APIContext) => {
	// generate a random state
	const state = generateState();

	// scopes for the GitHub OAuth2 request
	const scopes = ['user:email', 'repo'];

	// create the GitHub OAuth2 authorization URL
	const url = github.createAuthorizationURL(state, scopes);

	// set the state cookie
	setOAuthSessionTokenCookie(context, ProviderCookieName, state);

	// redirect the user to the GitHub OAuth2 authorization URL
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
