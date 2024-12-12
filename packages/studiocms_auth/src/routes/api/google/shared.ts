import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import Config from 'studiocms:config';
import { Google } from 'arctic';

export const {
	GOOGLE: { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI },
} = await authEnvCheck(Config.dashboardConfig.AuthConfig.providers);

const CLIENT = () => {
	return {
		ID: CLIENT_ID || '',
		SECRET: CLIENT_SECRET || '',
		URI: REDIRECT_URI || '',
	};
};

export const ProviderID = 'google';
export const ProviderCookieName = 'google_oauth_state';
export const ProviderCodeVerifier = 'google_oauth_code_verifier';

export const google = new Google(CLIENT().ID, CLIENT().SECRET, CLIENT().URI);

export interface GoogleUser {
	sub: string;
	picture: string;
	name: string;
	email: string;
}
