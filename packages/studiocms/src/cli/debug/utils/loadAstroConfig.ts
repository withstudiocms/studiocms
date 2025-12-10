import { pathToFileURL } from 'node:url';
import { loadConfigFile } from '@withstudiocms/config-utils';
import type { AstroUserConfig } from 'astro';
import { Effect } from 'effect';

const configPaths = [
	'astro.config.mjs',
	'astro.config.js',
	'astro.config.ts',
	'astro.config.cts',
	'astro.config.mts',
	'astro.config.cjs',
];

export const loadAstroConfig = Effect.tryPromise({
	try: async () => {
		const cwd = process.cwd();
		const rootURL = pathToFileURL(`${cwd}/`);
		return await loadConfigFile<AstroUserConfig>(rootURL, configPaths, 'astro');
	},
	catch: (error) => {
		throw new Error(`Failed to load Astro config: ${(error as Error).message}`);
	},
});
