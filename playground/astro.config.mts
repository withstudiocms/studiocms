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

function appendDistFrontendPaths(path: string): string[] {
	const distPath = `${path}/dist`;
	const frontendPath = `${path}/frontend`;
	return [distPath, frontendPath];
}

const packagePaths = [
	...appendDistPath(studiocmsScopedPackages),
	...appendDistPath(withstudiocmsScopedPackages),
	...appendDistFrontendPaths('../packages/studiocms'),
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

	// Used for devcontainer/docker development
	server: {
		port: 4321,
		host: true,
	},
});
