import db from '@astrojs/db';
import node from '@astrojs/node';
// import sentry from '@sentry/astro';
// import webVitals from '@astrojs/web-vitals';
// import studioCMSBlog from '@studiocms/blog';
// import devApps from '@studiocms/devapps';
import { defineConfig } from 'astro/config';
import studioCMS from 'studiocms';
// import { getCoolifyURL } from './hostUtils';

// https://astro.build/config
export default defineConfig({
	site: 'https://next-demo.studiocms.dev/',
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	security: {
		checkOrigin: false,
	},
	integrations: [
		db(),
		studioCMS({
			dbStartPage: false,
			verbose: true,
			defaultFrontEndConfig: {
				// htmlDefaultHead: [
				// 	{
				// 		tag: 'script',
				// 		attrs: {
				// 			src: 'https://analytics.studiocms.xyz/script.js',
				// 			'data-website-id': '23a84c25-40fd-4303-a191-aba4bfaf3ff1',
				// 			defer: true,
				// 		},
				// 	},
				// ],
			},
		}),
		// sentry({
		// 	dsn: 'https://71c3c874d5d8ad20486529628ac13aae@sentry.studiocms.dev/4',
		// 	replaysSessionSampleRate: 1.0,
		// 	replaysOnErrorSampleRate: 1.0,
		// 	sourceMapsUploadOptions: {
		// 		project: 'node-playground',
		// 		authToken: process.env.SENTRY_AUTH_TOKEN,
		// 	},
		// }),
		// webVitals(),
		// studioCMSBlog({
		// 	config: {
		// 		title: 'StudioCMS Test Blog',
		// 		description: 'A simple blog built with Astro and StudioCMS',
		// 	},
		// }),
		// devApps({
		// 	appsConfig: {
		// 		wpApiImporter: {
		// 			enabled: true,
		// 		},
		// 	},
		// }),
	],
});
