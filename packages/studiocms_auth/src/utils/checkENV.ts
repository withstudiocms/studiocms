import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { CheckENVStrings } from '@studiocms/core/strings';
import type { AstroIntegrationLogger } from 'astro';
import { loadEnv } from 'vite';
import type { StudioCMSAuthOptions } from '../schema';

const env = loadEnv('all', process.cwd(), 'CMS');

type KeyListType = Record<
	string,
	{ Keys: string[]; messages: { CheckMessage: string; ErrorMessage: string } }
>;

const keyList: KeyListType = {
	EncryptionKey: {
		Keys: ['CMS_ENCRYPTION_KEY'],
		messages: CheckENVStrings.EncryptionMessages,
	},
	Github: {
		Keys: ['CMS_GITHUB_CLIENT_ID', 'CMS_GITHUB_CLIENT_SECRET'],
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

		const { messages, Keys } = ProviderItem;

		infoLogger(messages.CheckMessage);

		const missingProviderKeys: string[] = [];

		for (const key of Keys) {
			if (!env[key]) {
				missingProviderKeys.push(key);
			}
		}

		if (missingProviderKeys.length > 0) {
			warnLogger(`${messages.ErrorMessage} ${missingProviderKeys.join(', ')}`);
		}
	}

	infoLogger(CheckENVStrings.CheckComplete);
};
