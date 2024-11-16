import * as Sentry from '@sentry/astro';

Sentry.init({
	dsn: 'https://4ff533e071fe898f4abf1e5b82dcc4d0@sentry.studiocms.xyz/3',
	integrations: [
		Sentry.feedbackIntegration({
			// Additional SDK configuration goes in here, for example:
			colorScheme: 'system',
			isNameRequired: true,
		}),
	],
});
