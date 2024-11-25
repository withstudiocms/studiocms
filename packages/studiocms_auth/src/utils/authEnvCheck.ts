import { getSecret } from 'astro:env/server';

type Providers = {
	github: boolean;
	discord: boolean;
	google: boolean;
	auth0: boolean;
	usernameAndPassword: boolean;
};

const AUTHKEYS = {
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

type AuthEnvCheckReponse = {
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

export async function authEnvCheck(providers: Providers): Promise<AuthEnvCheckReponse> {
	let GITHUBENABLED = false;
	let DISCORDENABLED = false;
	let GOOGLEENABLED = false;
	let AUTH0ENABLED = false;
	let isThereAnyOAuthProvider = false;
	let noProviderConfigured = false;

	if (providers.github && AUTHKEYS.GITHUB.CLIENT_ID && AUTHKEYS.GITHUB.CLIENT_SECRET) {
		GITHUBENABLED = true;
	}

	if (
		providers.discord &&
		AUTHKEYS.DISCORD.CLIENT_ID &&
		AUTHKEYS.DISCORD.CLIENT_SECRET &&
		AUTHKEYS.DISCORD.REDIRECT_URI
	) {
		DISCORDENABLED = true;
	}

	if (
		providers.google &&
		AUTHKEYS.GOOGLE.CLIENT_ID &&
		AUTHKEYS.GOOGLE.CLIENT_SECRET &&
		AUTHKEYS.GOOGLE.REDIRECT_URI
	) {
		GOOGLEENABLED = true;
	}

	if (
		providers.auth0 &&
		AUTHKEYS.AUTH0.CLIENT_ID &&
		AUTHKEYS.AUTH0.CLIENT_SECRET &&
		AUTHKEYS.AUTH0.DOMAIN &&
		AUTHKEYS.AUTH0.REDIRECT_URI
	) {
		AUTH0ENABLED = true;
	}

	// Check if there is any OAuth provider configured
	if (GITHUBENABLED || DISCORDENABLED || GOOGLEENABLED || AUTH0ENABLED) {
		isThereAnyOAuthProvider = true;
	}

	// Check if there is any OAuth or username and password provider configured
	if (!isThereAnyOAuthProvider && !providers.usernameAndPassword) {
		noProviderConfigured = true;
	}

	return {
		GITHUB: {
			ENABLED: GITHUBENABLED,
			CLIENT_ID: AUTHKEYS.GITHUB.CLIENT_ID,
			CLIENT_SECRET: AUTHKEYS.GITHUB.CLIENT_SECRET,
			REDIRECT_URI: AUTHKEYS.GITHUB.REDIRECT_URI,
		},
		DISCORD: {
			ENABLED: DISCORDENABLED,
			CLIENT_ID: AUTHKEYS.DISCORD.CLIENT_ID,
			CLIENT_SECRET: AUTHKEYS.DISCORD.CLIENT_SECRET,
			REDIRECT_URI: AUTHKEYS.DISCORD.REDIRECT_URI,
		},
		GOOGLE: {
			ENABLED: GOOGLEENABLED,
			CLIENT_ID: AUTHKEYS.GOOGLE.CLIENT_ID,
			CLIENT_SECRET: AUTHKEYS.GOOGLE.CLIENT_SECRET,
			REDIRECT_URI: AUTHKEYS.GOOGLE.REDIRECT_URI,
		},
		AUTH0: {
			ENABLED: AUTH0ENABLED,
			CLIENT_ID: AUTHKEYS.AUTH0.CLIENT_ID,
			CLIENT_SECRET: AUTHKEYS.AUTH0.CLIENT_SECRET,
			DOMAIN: AUTHKEYS.AUTH0.DOMAIN,
			REDIRECT_URI: AUTHKEYS.AUTH0.REDIRECT_URI,
		},
		SHOW_OAUTH: isThereAnyOAuthProvider,
		SHOW_PROVIDER_ERROR: noProviderConfigured,
	};
}
