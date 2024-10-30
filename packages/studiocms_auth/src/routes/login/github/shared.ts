import Config from 'virtual:studiocms/config';
import { GitHub } from 'arctic';
import { authEnvCheck } from '../../../utils/authEnvCheck';

const {
	GITHUB: { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI },
} = await authEnvCheck(Config.dashboardConfig.AuthConfig.providers);

const CLIENT = () => {
	return {
		ID: CLIENT_ID || '',
		SECRET: CLIENT_SECRET || '',
		URI: REDIRECT_URI || null,
	};
};

export const ProviderID = 'github';
export const ProviderCookieName = 'github_oauth_state';

export const github = new GitHub(CLIENT().ID, CLIENT().SECRET, CLIENT().URI);

export interface GitHubUser {
	id: number;
	html_url: string;
	login: string;
	avatar_url: string;
	name: string;
	blog: string;
	email: string;
}
