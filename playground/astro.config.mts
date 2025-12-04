import { globSync } from 'node:fs';
import node from '@astrojs/node';
import devApps from '@studiocms/devapps';
import { defineConfig } from 'astro/config';
import { hmrIntegration } from 'astro-integration-kit/dev';
import studioCMS from 'studiocms';

const site = process.env.DOKPLOY_DEPLOY_URL
	? `https://${process.env.DOKPLOY_DEPLOY_URL}`
	: 'https://playground.studiocms.dev';

console.log('Site URL:', site);

const studiocmsScopedPackages = globSync('../packages/@studiocms/*');
const withstudiocmsScopedPackages = globSync('../packages/@withstudiocms/*').filter(
	(v) => !v.endsWith('buildkit')
);

function appendDistPath(paths: string[]) {
	return paths.map((p) => `${p}/dist`);
}

const packagePaths = [
	...appendDistPath(studiocmsScopedPackages),
	...appendDistPath(withstudiocmsScopedPackages),
	'../packages/studiocms/frontend',
	'../packages/studiocms/dist',
];

console.log('HMR Package Paths:', packagePaths);

// https://astro.build/config
export default defineConfig({
	site,
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	security: {
		checkOrigin: false,
	},
	integrations: [
		hmrIntegration({
			directories: packagePaths,
		}),
		studioCMS(),
		devApps(),
	],

	vite: {
		build: {
			rollupOptions: {
				external: ['@libsql/client', '@libsql/kysely-libsql', 'pg', 'mysql2'],
			},
		},
	},

	// Used for devcontainer/docker development
	server: {
		port: 4321,
		host: true,
	},
});
