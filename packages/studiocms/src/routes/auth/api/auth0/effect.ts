import { Session } from 'studiocms:auth/lib';
import { generateCodeVerifier, generateState } from 'arctic';
import type { APIContext } from 'astro';
import { Effect } from 'effect';
import { genLogger } from '../../../../lib/effects/index.js';
import { ProviderCodeVerifier, ProviderCookieName, auth0 } from './shared.js';

export class Auth0OAuthAPI extends Effect.Service<Auth0OAuthAPI>()('Auth0OAuthAPI', {
	effect: genLogger('studiocms/routes/auth/api/auth0/effect')(function* () {
		const sessionHelper = yield* Session;

		const initSession = (context: APIContext) =>
			genLogger('studiocms/routes/auth/api/auth0/effect.initSession')(function* () {
				const state = generateState();

				const codeVerifier = generateCodeVerifier();

				const scopes = ['profile', 'email'];

				const url = auth0.createAuthorizationURL(state, codeVerifier, scopes);

				yield* sessionHelper.setOAuthSessionTokenCookie(context, ProviderCookieName, state);

				yield* sessionHelper.setOAuthSessionTokenCookie(context, ProviderCodeVerifier, codeVerifier);

				return context.redirect(url.toString());
			})

		return {
            initSession
        };
	}),
	dependencies: [Session.Default],
}) {
	static Provide = Effect.provide(this.Default)
}
