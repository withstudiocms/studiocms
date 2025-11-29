import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [],

	// Used for devcontainer/docker development
	server: {
		port: 4321,
		host: true,
	},
});
