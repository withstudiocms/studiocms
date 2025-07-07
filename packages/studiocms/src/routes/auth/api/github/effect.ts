import { Session } from 'studiocms:auth/lib';
import { generateState } from 'arctic';
import type { APIContext } from 'astro';
import { Effect } from 'effect';
import { genLogger } from '../../../../lib/effects/index.js';
import { ProviderCookieName, github } from './shared.js';

export class GitHubOAuthAPI extends Effect.Service<GitHubOAuthAPI>()('GitHubOAuthAPI', {
	effect: genLogger('studiocms/routes/auth/api/github/effect')(function* () {
		const sessionHelper = yield* Session;

		const initSession = (context: APIContext) =>
			genLogger('studiocms/routes/auth/api/google/effect.initSession')(function* () {
				const state = generateState();

				const scopes = ['user:email', 'repo'];

				const url = github.createAuthorizationURL(state, scopes);

				yield* sessionHelper.setOAuthSessionTokenCookie(context, ProviderCookieName, state);

				return context.redirect(url.toString());
			});

		return {
			initSession,
		};
	}),
	dependencies: [Session.Default],
}) {
	static Provide = Effect.provide(this.Default)
}
