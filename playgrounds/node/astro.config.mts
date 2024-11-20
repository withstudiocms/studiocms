import db from '@astrojs/db';
import node from '@astrojs/node';
import sentry from '@sentry/astro';
// import webvitals from '@astrojs/web-vitals';
import studioCMSBlog from '@studiocms/blog';
import devapps from '@studiocms/devapps';
import { defineConfig } from 'astro/config';
import studioCMS from '../../packages/studiocms/src';
import { getCoolifyURL } from '../../www/hostUtils';

// https://astro.build/config
export default defineConfig({
	site: getCoolifyURL(true) || 'https://demo.studiocms.xyz/',
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [
		sentry({
			dsn: 'https://34abf40ffdbf5e574344842942046b30@sentry.studiocms.xyz/2',
			replaysSessionSampleRate: 1.0,
			replaysOnErrorSampleRate: 1.0,
			sourceMapsUploadOptions: {
				project: 'studiocms-playground',
				authToken: process.env.SENTRY_AUTH_TOKEN,
			},
		}),
		db(),
		// webvitals(),
		studioCMS(), // StudioCMS Integration options can be found in `studiocms.config.mjs`
		studioCMSBlog({
			config: {
				title: 'StudioCMS Test Blog',
				description: 'A simple blog built with Astro and StudioCMS',
			},
		}),
		devapps({
			appsConfig: {
				wpApiImporter: {
					enabled: true,
				},
			},
		}),
	],
	image: {
		remotePatterns: [
			{
				protocol: 'https',
			},
		],
	},
});
