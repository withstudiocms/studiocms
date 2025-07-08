import fs, { existsSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineUtility } from 'astro-integration-kit';
import { build as esbuild } from 'esbuild';
import { StudioCMSCoreError } from '../errors.js';
import type { StudioCMSOptions } from '../schemas/index.js';
import { tryCatch } from './tryCatch.js';

/**
 * Paths to search for the StudioCMS config file,
 * sorted by how likely they're to appear.
 */
const configPaths = Object.freeze([
	'studiocms.config.js',
	'studiocms.config.mjs',
	'studiocms.config.cjs',
	'studiocms.config.ts',
	'studiocms.config.mts',
	'studiocms.config.cts',
]);

function findConfig(projectRootUrl: string) {
	for (const path of configPaths) {
		const configUrl = `${projectRootUrl}${path}`;
		if (exists(configUrl)) return configUrl;
	}
	return undefined;
}

export function exists(path: string | undefined) {
	if (!path) return false;
	try {
		fs.statSync(path);
		return true;
	} catch {
		return false;
	}
}

/**
 * Returns a URL to the optional StudioCMS config file in the Astro project root.
 */
export function getStudioConfigFileUrl(projectRootUrl: string) {
	const configPath = findConfig(projectRootUrl);
	if (configPath) return configPath;
	return undefined;
}

/**
 * Watches the StudioCMS configuration file for changes and adds it to the watch list.
 * This utility is defined for the 'astro:config:setup' event.
 *
 * @param params - The parameters provided by the Astro configuration setup event.
 * @param params.addWatchFile - Function to add a file to the watch list.
 * @param params.config - The current Astro configuration object.
 * @returns void
 */
export const watchStudioCMSConfig = defineUtility('astro:config:setup')(
	({
		addWatchFile,
		config: {
			root: { pathname },
		},
	}) => {
		const configFileUrl = getStudioConfigFileUrl(pathname);
		if (configFileUrl) addWatchFile(configFileUrl);
		return;
	}
);

export async function loadStudioCMSConfigFile(root: URL): Promise<StudioCMSOptions> {
	let configFileUrl: URL | undefined;

	const STUDIOCMS_CONFIG_FILE_NAMES = [
		'./studiocms.config.mjs',
		'./studiocms.config.mts',
		'./studiocms.config.js',
		'./studiocms.config.ts',
		'./studiocms.config.cjs',
		'./studiocms.config.cts',
	];

	for (const fileName of STUDIOCMS_CONFIG_FILE_NAMES) {
		const fileUrl = new URL(fileName, root);
		if (existsSync(fileUrl)) {
			configFileUrl = fileUrl;
		}
	}

	const { mod: configMod } = await loadAndBundleStudioCMSConfigFile({
		root,
		fileUrl: configFileUrl,
	});

	if (!configMod) {
		return undefined;
	}

	if (!configMod.default) {
		throw new StudioCMSCoreError(
			'Missing or invalid default export. Please export your StudioCMS config object as the default export.'
		);
	}

	return configMod.default;
}

async function loadAndBundleStudioCMSConfigFile({
	root,
	fileUrl,
}: {
	root: URL;
	fileUrl: URL | undefined;
}): Promise<{
	mod: { default?: unknown } | undefined;
	dependencies: string[];
}> {
	if (!fileUrl) {
		return { mod: undefined, dependencies: [] };
	}
	const { code, dependencies } = await bundleConfigFile({
		fileUrl,
	});
	return {
		mod: await importBundledFile({ code, root }),
		dependencies,
	};
}

/**
 * Forked from Vite config loader, replacing CJS-based path concat with ESM only
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L1074
 */
async function importBundledFile({
	code,
	root,
}: {
	code: string;
	root: URL;
}): Promise<{ default?: unknown }> {
	// Write it to disk, load it with native Node ESM, then delete the file.
	const tmpFileUrl = new URL(`./studiocms.config.timestamp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.mjs`, root);
	await writeFile(tmpFileUrl, code, { encoding: 'utf8' });
	try {
		return await import(/* @vite-ignore */ tmpFileUrl.toString());
	} finally {
		const [_data, _err] = await tryCatch(unlink(tmpFileUrl));
	}
}

/**
 * Bundle arbitrary `mjs` or `ts` file.
 * Simplified fork from Vite's `bundleConfigFile` function.
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L961
 */
async function bundleConfigFile({
	fileUrl,
}: {
	fileUrl: URL;
}) {
	const result = await esbuild({
		absWorkingDir: process.cwd(),
		entryPoints: [fileURLToPath(fileUrl)],
		outfile: 'out.js',
		packages: 'external',
		write: false,
		target: ['node16'],
		platform: 'node',
		bundle: true,
		format: 'esm',
		sourcemap: 'inline',
		metafile: true,
	});

	const file = result.outputFiles[0];
	if (!file) {
		throw new Error('Unexpected: no output file');
	}

	return {
		code: file.text,
		dependencies: Object.keys(result.metafile.inputs),
	};
}