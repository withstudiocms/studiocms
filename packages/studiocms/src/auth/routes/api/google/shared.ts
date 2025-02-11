import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import { AuthConfig } from 'studiocms:config';
import { Google } from 'arctic';

export const {
	GOOGLE: { CLIENT_ID = '', CLIENT_SECRET = '', REDIRECT_URI = '' },
} = await authEnvCheck(AuthConfig.providers);

export const ProviderID = 'google';
export const ProviderCookieName = 'google_oauth_state';
export const ProviderCodeVerifier = 'google_oauth_code_verifier';

export const google = new Google(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export interface GoogleUser {
	sub: string;
	picture: string;
	name: string;
	email: string;
}
