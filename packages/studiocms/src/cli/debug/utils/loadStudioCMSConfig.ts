import { pathToFileURL } from 'node:url';
import { loadConfigFile } from '@withstudiocms/config-utils';
import { Effect } from 'effect';
import type { StudioCMSOptions } from '#schemas';

const configPaths = [
	'studiocms.config.mjs',
	'studiocms.config.js',
	'studiocms.config.ts',
	'studiocms.config.cts',
	'studiocms.config.mts',
	'studiocms.config.cjs',
];

export const loadStudioCMSConfig = Effect.tryPromise({
	try: async () => {
		const cwd = process.cwd();
		const rootURL = pathToFileURL(`${cwd}/`);
		return await loadConfigFile<StudioCMSOptions>(rootURL, configPaths, 'studiocms');
	},
	catch: (error) => {
		throw new Error(`Failed to load StudioCMS config: ${(error as Error).message}`);
	},
});
