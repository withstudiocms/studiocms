import { authEnvCheck } from 'studiocms:auth/utils/authEnvCheck';
import { StudioCMSRoutes } from 'studiocms:helpers/routemap';
import Config from 'virtual:studiocms/config';

const {
	dashboardConfig: {
		AuthConfig: { providers },
	},
} = Config;

const {
	authLinks: { googleIndex, auth0Index, discordIndex, githubIndex },
} = StudioCMSRoutes;

const {
	DISCORD: { ENABLED: discordEnabled },
	GITHUB: { ENABLED: githubEnabled },
	GOOGLE: { ENABLED: googleEnabled },
	AUTH0: { ENABLED: auth0Enabled },
	SHOW_OAUTH,
} = await authEnvCheck(providers);

export const showOAuth = SHOW_OAUTH;

type ProviderData = {
	enabled: boolean;
	href: string;
	label: string;
	image: string;
};

export const providerData: ProviderData[] = [
	{
		enabled: githubEnabled,
		href: githubIndex,
		label: 'GitHub',
		image: `<svg width="1.5rem" height="auto" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg" class="oauth-logo"><path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="currentColor"/></svg>`,
	},
	{
		enabled: discordEnabled,
		href: discordIndex,
		label: 'Discord',
		image: `<svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="auto" viewBox="0 0 256 199" class="oauth-logo"><path fill="currentColor" d="M216.856 16.597A208.5 208.5 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046q-29.538-4.442-58.533 0c-1.832-4.4-4.55-9.933-6.846-14.046a207.8 207.8 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161 161 0 0 0 79.735 175.3a136.4 136.4 0 0 1-21.846-10.632a109 109 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a132 132 0 0 0 5.355 4.237a136 136 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848c21.142-6.58 42.646-16.637 64.815-33.213c5.316-56.288-9.08-105.09-38.056-148.36M85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2s23.236 11.804 23.015 26.2c.02 14.375-10.148 26.18-23.015 26.18m85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2c0 14.375-10.148 26.18-23.015 26.18"/></svg>`,
	},
	{
		enabled: googleEnabled,
		href: googleIndex,
		label: 'Google',
		image: `<svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="auto" viewBox="0 0 256 262" class="oauth-logo"><path fill="#4285f4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"/><path fill="#34a853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"/><path fill="#fbbc05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"/><path fill="#eb4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"/></svg>`,
	},
	{
		enabled: auth0Enabled,
		href: auth0Index,
		label: 'Auth0',
		image: `<svg xmlns="http://www.w3.org/2000/svg"  width="1.5rem" height="auto" viewBox="0 0 32 32" class="oauth-logo"><path fill="currentColor" d="M29.307 9.932L26.161 0H5.796L2.692 9.932c-1.802 5.75.042 12.271 5.089 16.021L16.01 32l8.208-6.068c5.005-3.75 6.911-10.25 5.089-16.021l-8.214 6.104l3.12 9.938l-8.208-6.13l-8.208 6.104l3.141-9.911l-8.25-6.063l10.177-.063l3.146-9.891l3.141 9.87z"/></svg>`,
	},
];
