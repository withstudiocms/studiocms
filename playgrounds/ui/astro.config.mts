import sentry from '@sentry/astro';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://ui-testing.studiocms.xyz',
	output: 'static',
	integrations: [
		sentry({
			dsn: 'https://4ff533e071fe898f4abf1e5b82dcc4d0@sentry.studiocms.xyz/3',
			sourceMapsUploadOptions: {
				project: 'studiocms-ui-testing',
				authToken: process.env.SENTRY_AUTH_TOKEN,
			},
		}),
	],
});
