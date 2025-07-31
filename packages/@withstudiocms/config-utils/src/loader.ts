import { constants } from 'node:fs';
import { access, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';
import type { ImportBundledFileArgs, LoadAndBundleConfigFileArgs, LoadAndBundleConfigFileResult } from './types.js';
import { tryCatch } from './utils/tryCatch.js';

/**
 * Bundle arbitrary `mjs` or `ts` file.
 * Simplified fork from Vite's `bundleConfigFile` function.
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L961
 */
export async function bundleConfigFile({ fileUrl }: { fileUrl: URL }) {
	const result = await esbuild({
		absWorkingDir: process.cwd(),
		entryPoints: [fileURLToPath(fileUrl)],
		outfile: 'out.js',
		packages: 'external',
		write: false,
		target: ['node18'],
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

/**
 * Forked from Vite config loader, replacing CJS-based path concat with ESM only
 *
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts#L1074
 */
export async function importBundledFile({
	code,
	root,
	label = 'bundled-tmp.config',
}: ImportBundledFileArgs): Promise<{ default?: unknown }> {
	// Write it to disk, load it with native Node ESM, then delete the file.
	const tmpFileUrl = new URL(
		`./${label}.timestamp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.mjs`,
		root
	);
	await writeFile(tmpFileUrl, code, { encoding: 'utf8' });
	try {
		return await import(/* @vite-ignore */ tmpFileUrl.toString());
	} finally {
		await tryCatch(unlink(tmpFileUrl));
	}
}

/**
 * Loads and bundles a configuration file, then imports the bundled module.
 *
 * @param params - The arguments for loading and bundling the config file.
 * @param params.root - The root directory for resolving imports.
 * @param params.fileUrl - The URL or path to the configuration file to load.
 * @param params.label - A label used for logging or identification purposes.
 * @returns A promise that resolves to an object containing the imported module (`mod`)
 *          and an array of its dependencies.
 */
export async function loadAndBundleConfigFile({
	root,
	fileUrl,
	label,
}: LoadAndBundleConfigFileArgs): Promise<LoadAndBundleConfigFileResult> {
	// If no file URL is provided, return an empty result
	if (!fileUrl) {
		return { mod: undefined, dependencies: [] };
	}

	// Bundle the configuration file and get its code and dependencies
	const { code, dependencies } = await bundleConfigFile({
		fileUrl,
	});

	// Import the bundled file using the provided root URL and optional label
	return {
		mod: await importBundledFile({ code, root, label }),
		dependencies,
	};
}

/**
 * Loads a configuration file from a list of possible paths relative to a given root URL.
 *
 * Iterates through the provided `configPaths`, checking for the existence of each file.
 * If a file is found, it is loaded and bundled, and its default export is returned as the configuration object.
 * If no valid configuration file is found, or if the file does not have a valid default export, the function returns `undefined`
 * or throws an error, respectively.
 *
 * @typeParam R - The expected shape of the configuration object.
 * @param root - The base URL to resolve configuration file paths against.
 * @param configPaths - An array of possible configuration file paths to check, relative to `root`.
 * @returns A promise that resolves to the configuration object of type `R`, or `undefined` if no valid config file is found.
 * @throws If a config file is found but does not have a valid default export.
 */
export async function loadConfigFile<R>(
	root: URL,
	configPaths: string[],
	label?: string
): Promise<R | undefined> {
	let configFileUrl: URL | undefined;

	// Check each path in the configPaths array to see if the file exists
	// If a file exists, set configFileUrl to that URL
	for (const path of configPaths) {
		const fileUrl = new URL(path, root);
		try {
			await access(fileUrl, constants.F_OK);
			configFileUrl = fileUrl;
			break;
		} catch {
			// File does not exist, continue to the next path
		}
	}

	// If no config file was found, return undefined
	// This is important to avoid unnecessary errors when no config file is present
	if (!configFileUrl) {
		return undefined;
	}

	// Load and bundle the configuration file
	// This will return the module and its dependencies
	const { mod: configMod } = await loadAndBundleConfigFile({
		root,
		fileUrl: configFileUrl,
		label,
	});

	// If no module was returned, return undefined
	// This is important to handle cases where the config file might be empty or invalid
	if (!configMod) {
		return undefined;
	}

	// Check if the module has a default export
	// If not, throw an error indicating that the default export is missing or invalid
	if (!configMod.default) {
		throw new Error(
			'Missing or invalid default export. Please export your config object as the default export.'
		);
	}

	// Return the default export of the module, which is expected to be of type R
	// This is the actual configuration object that will be used by the application
	// The type assertion ensures that the returned object conforms to the expected shape of R
	// This is important for type safety and to ensure that the configuration object has the expected properties
	return configMod.default as R;
}
