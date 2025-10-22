import db from '@astrojs/db';
import node from '@astrojs/node';
import devApps from '@studiocms/devapps';
import { defineConfig } from 'astro/config';
import studioCMS from 'studiocms';

const site = process.env.DOKPLOY_DEPLOY_URL
	? `https://${process.env.DOKPLOY_DEPLOY_URL}`
	: 'https://playground.studiocms.dev';

console.log('Site URL:', site);

// https://astro.build/config
export default defineConfig({
	site,
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	security: {
		checkOrigin: false,
	},
	integrations: [db(), studioCMS(), devApps()],

	// Used for devcontainer/docker development
	server: {
		port: 4321,
		host: true,
	},
});
