import { generateState } from 'arctic';
import type { APIContext, APIRoute } from 'astro';
import { setOAuthSessionTokenCookie } from '../../../lib/session';
import { ProviderCookieName, discord } from './shared';

export const GET: APIRoute = async (context: APIContext) => {
	const state = generateState();

	const scopes = ['identify', 'email'];

	const url: URL = discord.createAuthorizationURL(state, scopes);

	setOAuthSessionTokenCookie(context, ProviderCookieName, state);

	return context.redirect(url.toString());
};
