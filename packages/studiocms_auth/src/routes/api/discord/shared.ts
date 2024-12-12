import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import Config from 'studiocms:config';
import { Discord } from 'arctic';

export const {
	DISCORD: { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI },
} = await authEnvCheck(Config.dashboardConfig.AuthConfig.providers);

const CLIENT = () => {
	return {
		ID: CLIENT_ID || '',
		SECRET: CLIENT_SECRET || '',
		URI: REDIRECT_URI || '',
	};
};

export const ProviderID = 'discord';
export const ProviderCookieName = 'discord_oauth_state';

export const discord = new Discord(CLIENT().ID, CLIENT().SECRET, CLIENT().URI);

export interface DiscordUser {
	id: string;
	avatar: string;
	username: string;
	global_name: string;
	email: string;
}
