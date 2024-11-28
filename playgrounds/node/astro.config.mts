import db from '@astrojs/db';
import node from '@astrojs/node';
import sentry from '@sentry/astro';
// import webvitals from '@astrojs/web-vitals';
import studioCMSBlog from '@studiocms/blog';
import devapps from '@studiocms/devapps';
import { defineConfig } from 'astro/config';
import studioCMS from '../../packages/studiocms/src';
import { getCoolifyURL } from '../../www/docs/hostUtils';

// https://astro.build/config
export default defineConfig({
	site: getCoolifyURL(true) || 'https://demo.studiocms.dev/',
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [
		sentry({
			dsn: 'https://71c3c874d5d8ad20486529628ac13aae@sentry.studiocms.dev/4',
			replaysSessionSampleRate: 1.0,
			replaysOnErrorSampleRate: 1.0,
			sourceMapsUploadOptions: {
				project: 'node-playground',
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
