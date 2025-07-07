import { Session, User, VerifyEmail } from 'studiocms:auth/lib';
import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import { AuthConfig } from 'studiocms:config';
import { SDKCore } from 'studiocms:sdk';
import { generateState } from 'arctic';
import { GitHub } from 'arctic';
import type { APIContext } from 'astro';
import { Effect } from 'effect';
import { genLogger } from '../../../../lib/effects/index.js';

const {
	GITHUB: { CLIENT_ID = '', CLIENT_SECRET = '', REDIRECT_URI = null },
} = await authEnvCheck(AuthConfig.providers);

export const ProviderID = 'github';
export const ProviderCookieName = 'github_oauth_state';

export const github = new GitHub(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export interface GitHubUser {
	id: number;
	html_url: string;
	login: string;
	avatar_url: string;
	name: string;
	blog: string;
	email: string;
}

export class GitHubOAuthAPI extends Effect.Service<GitHubOAuthAPI>()('GitHubOAuthAPI', {
	effect: genLogger('studiocms/routes/auth/api/github/effect')(function* () {
		const sessionHelper = yield* Session;
		const sdk = yield* SDKCore;
		const verifyEmail = yield* VerifyEmail;
		const userLib = yield* User;

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
	dependencies: [Session.Default, SDKCore.Default, VerifyEmail.Default, User.Default],
}) {
	static Provide = Effect.provide(this.Default);
}
