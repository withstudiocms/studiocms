import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import studioCMS from 'studiocms';

const site =
	process.env.NODE_ENV === 'production'
		? 'https://playground.studiocms.dev'
		: 'http://localhost:4321';

// console.log('Site URL:', site);

// https://astro.build/config
export default defineConfig({
	site,
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	security: {
		checkOrigin: false,
		allowedDomains: [
			{
				hostname: 'localhost',
				port: '4321',
			},
		],
	},
	integrations: [studioCMS()],
	// Used for devcontainer/docker development
	server: {
		port: 4321,
		host: true,
	},
});
