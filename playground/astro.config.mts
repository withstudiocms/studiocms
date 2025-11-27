import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import studioCMS from 'studiocms';

// import db from '@astrojs/db';
// import devApps from '@studiocms/devapps';

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
	integrations: [studioCMS()],

	// Used for devcontainer/docker development
	server: {
		port: 4321,
		host: true,
	},
});
