import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import studioCMS from 'studiocms';

// https://astro.build/config
export default defineConfig({
	site: process.env.NODE_ENV === 'production' ? 'https://change.me' : 'http://localhost:4321',
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	security: {
		checkOrigin: false, // This depends on your hosting provider
	},
	integrations: [studioCMS()],
});
