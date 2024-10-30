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
