import db from '@astrojs/db';
import node from '@astrojs/node';
import webVitals from '@astrojs/web-vitals';
import devApps from '@studiocms/devapps';
import { defineConfig } from 'astro/config';
import studioCMS from 'studiocms';
import { getCoolifyURL } from './hostUtils';

// https://astro.build/config
export default defineConfig({
	site: getCoolifyURL(true) || 'https://playground.studiocms.dev',
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	security: {
		checkOrigin: false,
	},
	integrations: [db(), studioCMS(), devApps(), webVitals()],
});
