import * as Sentry from '@sentry/astro';

Sentry.init({
	dsn: 'https://34abf40ffdbf5e574344842942046b30@sentry.studiocms.xyz/2',
	integrations: [
		Sentry.feedbackIntegration({
			// Additional SDK configuration goes in here, for example:
			colorScheme: 'system',
			isNameRequired: true,
		}),
	],
});
