import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import Config from 'virtual:studiocms/config';
import { Auth0 } from 'arctic';

export const {
	AUTH0: { CLIENT_ID, CLIENT_SECRET, DOMAIN, REDIRECT_URI },
} = await authEnvCheck(Config.dashboardConfig.AuthConfig.providers);

export const getClientDomain = () => {
	const cleanDomainslash = DOMAIN ? DOMAIN.replace(/^\//, '') : '';

	const NoHTTPDOMAIN = cleanDomainslash.replace(/http:\/\//, '').replace(/https:\/\//, '');

	return `https://${NoHTTPDOMAIN}`;
};

const CLIENT = () => {
	return {
		DOMAIN: getClientDomain(),
		ID: CLIENT_ID || '',
		SECRET: CLIENT_SECRET || '',
		URI: REDIRECT_URI || '',
	};
};

export const ProviderID = 'auth0';
export const ProviderCookieName = 'auth0_oauth_state';

export const auth0 = new Auth0(CLIENT().DOMAIN, CLIENT().ID, CLIENT().SECRET, CLIENT().URI);

export interface Auth0User {
	sub: string;
	name: string;
	email: string;
	picture: string;
	nickname: string;
}
