import type fsType from 'node:fs';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { isRunnableDevEnvironment, type ViteDevServer } from 'vite';
import { createMinimalViteDevServer } from './utils/createMinimalViteDevServer.js';
import loadFallbackPlugin from './utils/vite-plugin-load-fallback.js';

/**
 * Options for loading a configuration file with Vite.
 *
 * @property root - The root directory for resolving imports.
 * @property configPaths - An array of possible configuration file paths to check, relative to `root`.
 * @property fs - The file system module to use for checking file existence.
 */
export interface LoadConfigWithViteOptions {
	root: URL;
	configPaths: string[];
	fs: typeof fsType;
}

/**
 * Loads a configuration file using Vite's development server.
 *
 * @param options - The options for loading the configuration file.
 * @param options.root - The root directory for resolving imports.
 * @param options.configPaths - An array of possible configuration file paths to check, relative to `root`.
 * @param options.fs - The file system module to use for checking file existence.
 * @returns A promise that resolves to the configuration object, or an empty object if no config file is found.
 */
export async function loadConfigFile({
	configPaths,
	root,
	fs,
// biome-ignore lint/suspicious/noExplicitAny: We are dynamically loading a config
}: LoadConfigWithViteOptions): Promise<Record<string, any>> {
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

	// If no config file was found, return an empty object
	if (!configFileUrl) {
    return {};
	}

	// Attempt to load config using Node's native ESM loader if the file has a .js, .cjs, or .mjs extension
	if (/\.[cm]?js$/.test(configFileUrl.pathname)) {
		try {
			const config = await import(`${configFileUrl.toString()}?t=${Date.now()}`);
			return config.default ?? {};
		} catch (e) {
			if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_DLOPEN_DISABLED') {
				throw e;
			}

			console.debug('Failed to load config with Node', e);
		}
	}

	// Else try loading with Vite
	let server: ViteDevServer | undefined;
	try {
		const plugins = loadFallbackPlugin({ fs, root });
		server = await createMinimalViteDevServer(plugins);

		if (isRunnableDevEnvironment(server.environments.ssr)) {
			const environment = server.environments.ssr;
			const mod = await environment.runner.import(configFileUrl.toString());
			return mod.default ?? {};
		}
		return {};
	} finally {
		if (server) {
			await server.close();
		}
	}
}
