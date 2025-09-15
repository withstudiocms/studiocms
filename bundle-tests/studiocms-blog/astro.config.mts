import db from '@astrojs/db';
import node from '@astrojs/node';
import codecovAstroPlugin from '@codecov/astro-plugin';
import { defineConfig } from 'astro/config';
import studioCMS from 'studiocms';

// https://astro.build/config
export default defineConfig({
	site: 'https://change.me',
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	security: {
		checkOrigin: false, // This depends on your hosting provider
	},
	integrations: [
		db(),
		studioCMS(),
		codecovAstroPlugin({
			enableBundleAnalysis: true,
			bundleName: 'studiocms-blog-astro-bundle',
			uploadToken: process.env.CODECOV_TOKEN,
			telemetry: false,
			uploadOverrides: {
				sha: process.env.GH_COMMIT_SHA,
			},
		}),
	],
});
