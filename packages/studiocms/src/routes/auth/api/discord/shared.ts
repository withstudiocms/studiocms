import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import { AuthConfig } from 'studiocms:config';
import { Discord } from 'arctic';

export const {
	DISCORD: { CLIENT_ID = '', CLIENT_SECRET = '', REDIRECT_URI = '' },
} = await authEnvCheck(AuthConfig.providers);

export const ProviderID = 'discord';
export const ProviderCookieName = 'discord_oauth_state';
export const ProviderCodeVerifier = 'discord_oauth_code_verifier';

export const discord = new Discord(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export interface DiscordUser {
	id: string;
	avatar: string;
	username: string;
	global_name: string;
	email: string;
}
