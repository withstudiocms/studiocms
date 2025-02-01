// @ts-nocheck
import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import { AuthConfig } from 'studiocms:config';
import { Auth0 } from 'arctic';

export const {
	AUTH0: { CLIENT_ID = '', CLIENT_SECRET = '', DOMAIN, REDIRECT_URI = '' },
} = await authEnvCheck(AuthConfig.providers);

export const getClientDomain = () => {
	const cleanDomainSlash = DOMAIN ? DOMAIN.replace(/^\//, '') : '';

	const NoHttpDomain = cleanDomainSlash.replace(/http:\/\//, '').replace(/https:\/\//, '');

	return `https://${NoHttpDomain}`;
};

export const ProviderID = 'auth0';
export const ProviderCookieName = 'auth0_oauth_state';

export const auth0 = new Auth0(getClientDomain(), CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export interface Auth0User {
	sub: string;
	name: string;
	email: string;
	picture: string;
	nickname: string;
}
