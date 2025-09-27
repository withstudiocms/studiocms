import db from '@astrojs/db';
import node from '@astrojs/node';
import devApps from '@studiocms/devapps';
import { defineConfig } from 'astro/config';
import studioCMS from 'studiocms';

// import { getCoolifyURL } from './hostUtils';

const site = process.env.PR_URL
	? `https://${process.env.PR_URL}`
	: 'https://playground.studiocms.dev';

console.log('Using site URL:', site);

// https://astro.build/config
export default defineConfig({
	site,
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	security: {
		checkOrigin: false,
	},
	integrations: [db(), studioCMS(), devApps()],
});
