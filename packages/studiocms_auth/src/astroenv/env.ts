import type { AstroConfig } from 'astro';
import { envField } from 'astro/config';

export const astroENV: AstroConfig['experimental']['env'] = {
	validateSecrets: true,
	schema: {
		// Auth Encryption Key
		CMS_ENCRYPTION_KEY: envField.string({
			context: 'server',
			access: 'secret',
			optional: false,
		}),
		// GitHub Auth Provider Environment Variables
		CMS_GITHUB_CLIENT_ID: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
		CMS_GITHUB_CLIENT_SECRET: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
		// Discord Auth Provider Environment Variables
		CMS_DISCORD_CLIENT_ID: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
		CMS_DISCORD_CLIENT_SECRET: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
		CMS_DISCORD_REDIRECT_URI: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
		// Google Auth Provider Environment Variables
		CMS_GOOGLE_CLIENT_ID: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
		CMS_GOOGLE_CLIENT_SECRET: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
		CMS_GOOGLE_REDIRECT_URI: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
		// Auth0 Auth Provider Environment Variables
		CMS_AUTH0_CLIENT_ID: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
		CMS_AUTH0_CLIENT_SECRET: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
		CMS_AUTH0_DOMAIN: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
		CMS_AUTH0_REDIRECT_URI: envField.string({
			context: 'server',
			access: 'secret',
			optional: true,
		}),
	},
};
