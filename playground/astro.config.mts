import { globSync } from 'node:fs';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import { hmrIntegration } from 'astro-integration-kit/dev';
import studioCMS from 'studiocms';

const site =
	process.env.NODE_ENV === 'production'
		? process.env.DOKPLOY_DEPLOY_URL
			? `https://${process.env.DOKPLOY_DEPLOY_URL}`
			: 'https://playground.studiocms.dev'
		: 'http://localhost:4321';

// console.log('Site URL:', site);

const studiocmsScopedPackages = globSync('../packages/@studiocms/*').filter(
	(v) => !v.endsWith('migrator')
);
const withstudiocmsScopedPackages = globSync('../packages/@withstudiocms/*').filter(
	(v) => !v.endsWith('buildkit')
);

function appendDistPath(paths: string[]) {
	return paths.map((p) => `${p}/dist`);
}

function appendDistFrontendPaths(path: string): string[] {
	const distPath = `${path}/dist`;
	return [distPath];
}

const packagePaths = [
	...appendDistPath(studiocmsScopedPackages),
	...appendDistPath(withstudiocmsScopedPackages),
	...appendDistFrontendPaths('../packages/studiocms'),
];

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
	],

	// Used for devcontainer/docker development
	server: {
		port: 4321,
		host: true,
	},
});
