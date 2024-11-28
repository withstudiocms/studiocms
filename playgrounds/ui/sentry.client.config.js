import * as Sentry from '@sentry/astro';

Sentry.init({
	dsn: 'https://0f2693e5cc4590650ad844d6ad3f973f@sentry.studiocms.dev/3',
	integrations: [
		Sentry.feedbackIntegration({
			// Additional SDK configuration goes in here, for example:
			colorScheme: 'system',
			isNameRequired: true,
		}),
	],
});
