import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import type { AstroIntegrationLogger } from 'astro';
import { loadEnv } from 'vite';
import type { StudioCMSAuthOptions } from '../schema';

const env = loadEnv('all', process.cwd(), 'CMS');

type KeyListType = Record<
	string,
	{
		Keys: string[];
		optionalKeys?: string[];
		messages: { CheckMessage: string; ErrorMessage: string };
	}
>;

export const CheckENVStrings = {
	CheckStart: 'Checking Environment Variables...',
	CheckComplete: 'Environment Variables Check Complete.',
	GithubMessages: {
		CheckMessage: 'Github Auth Enabled, Checking Github Environment Variables...',
		ErrorMessage:
			'The Following Github Keys are Missing and are Required for the Github Authentication to work:',
	},
	DiscordMessages: {
		CheckMessage: 'Discord Auth Enabled, Checking Discord Environment Variables...',
		ErrorMessage:
			'The Following Discord Keys are Missing and are Required for the Discord Authentication to work:',
	},
	GoogleMessages: {
		CheckMessage: 'Google Auth Enabled, Checking Google Environment Variables...',
		ErrorMessage:
			'The Following Google Keys are Missing and are Required for the Google Authentication to work:',
	},
	Auth0Messages: {
		CheckMessage: 'Auth0 Auth Enabled, Checking Auth0 Environment Variables...',
		ErrorMessage:
			'The Following Auth0 Keys are Missing and are Required for the Auth0 Authentication to work:',
	},
	EncryptionMessages: {
		CheckMessage: 'Checking Encryption Key...',
		ErrorMessage: 'The CMS_ENCRYPTION_KEY is Missing and is Required for StudioCMS to work:',
	},
};

const keyList: KeyListType = {
	EncryptionKey: {
		Keys: ['CMS_ENCRYPTION_KEY'],
		messages: CheckENVStrings.EncryptionMessages,
	},
	Github: {
		Keys: ['CMS_GITHUB_CLIENT_ID', 'CMS_GITHUB_CLIENT_SECRET'],
		optionalKeys: ['CMS_GITHUB_REDIRECT_URI'],
		messages: CheckENVStrings.GithubMessages,
	},
	Discord: {
		Keys: ['CMS_DISCORD_CLIENT_ID', 'CMS_DISCORD_CLIENT_SECRET', 'CMS_DISCORD_REDIRECT_URI'],
		messages: CheckENVStrings.DiscordMessages,
	},
	Google: {
		Keys: ['CMS_GOOGLE_CLIENT_ID', 'CMS_GOOGLE_CLIENT_SECRET', 'CMS_GOOGLE_REDIRECT_URI'],
		messages: CheckENVStrings.GoogleMessages,
	},
	Auth0: {
		Keys: [
			'CMS_AUTH0_CLIENT_ID',
			'CMS_AUTH0_CLIENT_SECRET',
			'CMS_AUTH0_DOMAIN',
			'CMS_AUTH0_REDIRECT_URI',
		],
		messages: CheckENVStrings.Auth0Messages,
	},
};

function matchAvailableProviders(providers: {
	github: boolean;
	discord: boolean;
	google: boolean;
	auth0: boolean;
}) {
	const { github, discord, google, auth0 } = providers;

	const enabledProviders = ['EncryptionKey'];

	if (github) {
		enabledProviders.push('Github');
	}

	if (discord) {
		enabledProviders.push('Discord');
	}

	if (google) {
		enabledProviders.push('Google');
	}

	if (auth0) {
		enabledProviders.push('Auth0');
	}

	return enabledProviders;
}

export const checkEnvKeys = async (
	logger: AstroIntegrationLogger,
	options: StudioCMSAuthOptions
) => {
	const {
		verbose,
		dashboardConfig: {
			AuthConfig: { providers },
		},
	} = options;

	const infoLogger = (message: string) => {
		integrationLogger({ logger, logLevel: 'info', verbose }, message);
	};

	const warnLogger = (message: string) => {
		integrationLogger({ logger, logLevel: 'warn', verbose: true }, message);
	};

	infoLogger(CheckENVStrings.CheckStart);

	const enabledProviders = matchAvailableProviders(providers);

	for (const provider of enabledProviders) {
		const ProviderItem = keyList[provider];

		if (!ProviderItem) {
			continue;
		}

		const { messages, Keys, optionalKeys } = ProviderItem;

		infoLogger(messages.CheckMessage);

		const missingProviderKeys: string[] = [];

		for (const key of Keys) {
			if (!env[key]) {
				missingProviderKeys.push(key);
			}
		}

		for (const key of optionalKeys || []) {
			if (!env[key]) {
				warnLogger(`The following optional key is missing and may or may not be required: ${key}`);
			}
		}

		if (missingProviderKeys.length > 0) {
			warnLogger(`${messages.ErrorMessage} ${missingProviderKeys.join(', ')}`);
		}
	}

	infoLogger(CheckENVStrings.CheckComplete);
};
