import { generateCodeVerifier, generateState } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import { setOAuthSessionTokenCookie } from '../../../lib/session';
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
