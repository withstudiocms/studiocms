import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import { AuthConfig } from 'studiocms:config';
import { GitHub } from 'arctic';

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
