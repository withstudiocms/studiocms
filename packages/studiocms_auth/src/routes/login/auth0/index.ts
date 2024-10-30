import { generateState } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import { setOAuthSessionTokenCookie } from '../../../lib/session';
import { ProviderCookieName, auth0 } from './shared';

export const GET: APIRoute = async (context: APIContext) => {
	const state = generateState();

	const scopes = ['profile', 'email'];

	const url = auth0.createAuthorizationURL(state, scopes);

	setOAuthSessionTokenCookie(context, ProviderCookieName, state);

	return context.redirect(url.toString());
};
