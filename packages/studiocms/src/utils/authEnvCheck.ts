import { getSecret } from 'astro:env/server';

type Providers = {
	github: boolean;
	discord: boolean;
	google: boolean;
	auth0: boolean;
	usernameAndPassword: boolean;
};

const AUTH_KEYS = {
	GITHUB: {
		CLIENT_ID: getSecret('CMS_GITHUB_CLIENT_ID'),
		CLIENT_SECRET: getSecret('CMS_GITHUB_CLIENT_SECRET'),
		REDIRECT_URI: getSecret('CMS_GITHUB_REDIRECT_URI'),
	},
	DISCORD: {
		CLIENT_ID: getSecret('CMS_DISCORD_CLIENT_ID'),
		CLIENT_SECRET: getSecret('CMS_DISCORD_CLIENT_SECRET'),
		REDIRECT_URI: getSecret('CMS_DISCORD_REDIRECT_URI'),
	},
	GOOGLE: {
		CLIENT_ID: getSecret('CMS_GOOGLE_CLIENT_ID'),
		CLIENT_SECRET: getSecret('CMS_GOOGLE_CLIENT_SECRET'),
		REDIRECT_URI: getSecret('CMS_GOOGLE_REDIRECT_URI'),
	},
	AUTH0: {
		CLIENT_ID: getSecret('CMS_AUTH0_CLIENT_ID'),
		CLIENT_SECRET: getSecret('CMS_AUTH0_CLIENT_SECRET'),
		DOMAIN: getSecret('CMS_AUTH0_DOMAIN'),
		REDIRECT_URI: getSecret('CMS_AUTH0_REDIRECT_URI'),
	},
};

export type AuthEnvCheckResponse = {
	GITHUB: {
		ENABLED: boolean;
		CLIENT_ID: string | undefined;
		CLIENT_SECRET: string | undefined;
		REDIRECT_URI: string | undefined;
	};
	DISCORD: {
		ENABLED: boolean;
		CLIENT_ID: string | undefined;
		CLIENT_SECRET: string | undefined;
		REDIRECT_URI: string | undefined;
	};
	GOOGLE: {
		ENABLED: boolean;
		CLIENT_ID: string | undefined;
		CLIENT_SECRET: string | undefined;
		REDIRECT_URI: string | undefined;
	};
	AUTH0: {
		ENABLED: boolean;
		CLIENT_ID: string | undefined;
		CLIENT_SECRET: string | undefined;
		DOMAIN: string | undefined;
		REDIRECT_URI: string | undefined;
	};
	SHOW_OAUTH: boolean;
	SHOW_PROVIDER_ERROR: boolean;
};

export async function authEnvCheck(providers: Providers): Promise<AuthEnvCheckResponse> {
	let GITHUB_ENABLED = false;
	let DISCORD_ENABLED = false;
	let GOOGLE_ENABLED = false;
	let AUTH0_ENABLED = false;
	let isThereAnyOAuthProvider = false;
	let noProviderConfigured = false;

	if (providers.github && AUTH_KEYS.GITHUB.CLIENT_ID && AUTH_KEYS.GITHUB.CLIENT_SECRET) {
		GITHUB_ENABLED = true;
	}

	if (
		providers.discord &&
		AUTH_KEYS.DISCORD.CLIENT_ID &&
		AUTH_KEYS.DISCORD.CLIENT_SECRET &&
		AUTH_KEYS.DISCORD.REDIRECT_URI
	) {
		DISCORD_ENABLED = true;
	}

	if (
		providers.google &&
		AUTH_KEYS.GOOGLE.CLIENT_ID &&
		AUTH_KEYS.GOOGLE.CLIENT_SECRET &&
		AUTH_KEYS.GOOGLE.REDIRECT_URI
	) {
		GOOGLE_ENABLED = true;
	}

	if (
		providers.auth0 &&
		AUTH_KEYS.AUTH0.CLIENT_ID &&
		AUTH_KEYS.AUTH0.CLIENT_SECRET &&
		AUTH_KEYS.AUTH0.DOMAIN &&
		AUTH_KEYS.AUTH0.REDIRECT_URI
	) {
		AUTH0_ENABLED = true;
	}

	// Check if there is any OAuth provider configured
	if (GITHUB_ENABLED || DISCORD_ENABLED || GOOGLE_ENABLED || AUTH0_ENABLED) {
		isThereAnyOAuthProvider = true;
	}

	// Check if there is any OAuth or username and password provider configured
	if (!isThereAnyOAuthProvider && !providers.usernameAndPassword) {
		noProviderConfigured = true;
	}

	return {
		GITHUB: {
			ENABLED: GITHUB_ENABLED,
			CLIENT_ID: AUTH_KEYS.GITHUB.CLIENT_ID,
			CLIENT_SECRET: AUTH_KEYS.GITHUB.CLIENT_SECRET,
			REDIRECT_URI: AUTH_KEYS.GITHUB.REDIRECT_URI,
		},
		DISCORD: {
			ENABLED: DISCORD_ENABLED,
			CLIENT_ID: AUTH_KEYS.DISCORD.CLIENT_ID,
			CLIENT_SECRET: AUTH_KEYS.DISCORD.CLIENT_SECRET,
			REDIRECT_URI: AUTH_KEYS.DISCORD.REDIRECT_URI,
		},
		GOOGLE: {
			ENABLED: GOOGLE_ENABLED,
			CLIENT_ID: AUTH_KEYS.GOOGLE.CLIENT_ID,
			CLIENT_SECRET: AUTH_KEYS.GOOGLE.CLIENT_SECRET,
			REDIRECT_URI: AUTH_KEYS.GOOGLE.REDIRECT_URI,
		},
		AUTH0: {
			ENABLED: AUTH0_ENABLED,
			CLIENT_ID: AUTH_KEYS.AUTH0.CLIENT_ID,
			CLIENT_SECRET: AUTH_KEYS.AUTH0.CLIENT_SECRET,
			DOMAIN: AUTH_KEYS.AUTH0.DOMAIN,
			REDIRECT_URI: AUTH_KEYS.AUTH0.REDIRECT_URI,
		},
		SHOW_OAUTH: isThereAnyOAuthProvider,
		SHOW_PROVIDER_ERROR: noProviderConfigured,
	};
}
