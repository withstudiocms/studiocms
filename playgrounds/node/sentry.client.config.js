import * as Sentry from '@sentry/astro';

Sentry.init({
	dsn: 'https://34abf40ffdbf5e574344842942046b30@sentry.studiocms.xyz/2',
	integrations: [
		Sentry.feedbackIntegration({
			// Additional SDK configuration goes in here, for example:
			colorScheme: 'system',
			isNameRequired: true,
		}),
		Sentry.replayIntegration(),
	],
	// Session Replay
	replaysSessionSampleRate: 1.0, // `0.1` sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
	replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});
