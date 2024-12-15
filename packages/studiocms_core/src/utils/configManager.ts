import { statSync } from 'node:fs';
import { defineUtility } from 'astro-integration-kit';
import { StudioCMSCoreError } from '../errors';
import type { StudioCMSOptions } from '../schemas';

// This File was created based on Expressive Code's Astro Integration by Hippotastic on github
// see: https://expressive-code.com/ & https://github.com/expressive-code/expressive-code

/**
 * Paths to search for the StudioCMS config file,
 * sorted by how likely they're to appear.
 */
const configPaths = Object.freeze([
	'studiocms.config.mjs',
	'studiocms.config.js',
	'studiocms.config.ts',
	'studiocms.config.mts',
	'studiocms.config.cjs',
	'studiocms.config.cts',
]);

function findConfig(projectRootUrl: string) {
	for (const path of configPaths) {
		const configUrl = `${projectRootUrl}${path}`;
		if (exists(configUrl)) {
			return configUrl;
		}
	}

	return undefined;
}

export function exists(path: string | undefined) {
	if (!path) return false;
	try {
		statSync(path);
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
	if (configPath) {
		return configPath;
	}
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
		// addWatchFile,
		config: {
			root: { pathname },
		},
	}) => {
		const configFileUrl = getStudioConfigFileUrl(pathname);
		if (configFileUrl) {
			// addWatchFile(configFileUrl);
			// This has been disabled due to a Vite dynamic import issue preventing loading the config file
			return `There is a StudioCMS config file at ${configFileUrl}, due to a vite bug, this file will be ignored. Please use the Astro config file for StudioCMS options for the time being.`;
		}
		return;
	}
);

/**
 * Attempts to import an StudioCMS  config file in the Astro project root and returns its default export.
 *
 * If no config file is found, an empty object is returned.
 */
export async function loadStudioCMSConfigFile(projectRootUrl: URL): Promise<StudioCMSOptions> {
	// Find the StudioCMS config file in the project root
	const pathsToTry = [
		// This path works in most scenarios, but not when the integration is processed by Vite
		// due to a Vite bug affecting import URLs using the "file:" protocol
		new URL(`./studiocms.config.mts?t=${Date.now()}`, projectRootUrl).href,
		new URL(`./studiocms.config.mjs?t=${Date.now()}`, projectRootUrl).href,
		new URL(`./studiocms.config.js?t=${Date.now()}`, projectRootUrl).href,
		new URL(`./studiocms.config.ts?t=${Date.now()}`, projectRootUrl).href,
		new URL(`./studiocms.config.cjs?t=${Date.now()}`, projectRootUrl).href,
		new URL(`./studiocms.config.cts?t=${Date.now()}`, projectRootUrl).href,
	];
	// Detect if the integration is processed by Vite
	if (import.meta.env?.BASE_URL?.length) {
		// Add a fallback path starting with "/", which Vite treats as relative to the project root
		pathsToTry.push(`/studiocms.config.mts?t=${Date.now()}`);
		pathsToTry.push(`/studiocms.config.mjs?t=${Date.now()}`);
		pathsToTry.push(`/studiocms.config.js?t=${Date.now()}`);
		pathsToTry.push(`/studiocms.config.ts?t=${Date.now()}`);
		pathsToTry.push(`/studiocms.config.cjs?t=${Date.now()}`);
		pathsToTry.push(`/studiocms.config.cts?t=${Date.now()}`);
	}

	/**
	 * Checks the error received on attempting to import StudioCMS config file.
	 * Bun's choice to throw ResolveMessage for import resolver messages means
	 * type comparison (error instanceof Error) isn't portable.
	 * @param error Error object, which could be string, Error, or ResolveMessage.
	 * @returns object containing message and, if present, error code.
	 */
	function coerceError(error: unknown): { message: string; code?: string | undefined } {
		if (typeof error === 'object' && error !== null && 'message' in error) {
			return error as { message: string; code?: string | undefined };
		}
		return { message: error as string };
	}
	for (const path of pathsToTry) {
		try {
			// Attempt to import the config file dynamically
			console.log('configPath', path);
			const module = (await import(/* @vite-ignore */ path)) as { default: StudioCMSOptions };
			if (!module.default) {
				throw new Error(
					'Missing or invalid default export. Please export your StudioCMS config object as the default export.'
				);
			}
			return module.default;
		} catch (error) {
			const { message, code } = coerceError(error);

			// If the config file exists but fails to load, throw an error
			if (code !== 'ERR_MODULE_NOT_FOUND' && code !== 'ERR_LOAD_URL') {
				throw new StudioCMSCoreError(
					`Your project includes an StudioCMS config file ("studiocms.config.{mjs|js|ts|mts|cjs|cts}") that could not be loaded due to ${code ? `the error ${code}` : 'the following error'}: ${message}`.replace(
						/\s+/g,
						' '
					),
					error instanceof Error ? error.stack : ''
				);
			}
		}
	}

	// Return an empty object if no config file is found or if all attempts fail
	return {} as StudioCMSOptions;
}
