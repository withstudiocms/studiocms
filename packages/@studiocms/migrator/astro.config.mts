import db from '@astrojs/db';
import node from '@astrojs/node';
import ui from '@studiocms/ui';
import { defineConfig } from 'astro/config';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ quiet: true });

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [db(), ui()],
	vite: {
		build: {
			rollupOptions: {
				external: [
					'@libsql/client',
					'@libsql/win32-x64-msvc',
					'@libsql/win32-arm64-msvc',
					'@libsql/linux-x64-gnu',
					'@libsql/linux-arm64-gnu',
					'@libsql/darwin-x64',
					'@libsql/darwin-arm64',
				],
			},
			commonjsOptions: {
				dynamicRequireTargets: [
					'@libsql/win32-x64-msvc',
					'@libsql/win32-arm64-msvc',
					'@libsql/linux-x64-gnu',
					'@libsql/linux-arm64-gnu',
					'@libsql/darwin-x64',
					'@libsql/darwin-arm64',
				],
			},
		},
	},
});
