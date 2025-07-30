import { statSync } from 'node:fs';
import { defineUtility } from 'astro-integration-kit';

/**
 * Checks whether the specified file or directory exists.
 *
 * @param path - The path to the file or directory to check. If `undefined`, the function returns `false`.
 * @returns `true` if the file or directory exists, otherwise `false`.
 */
export function exists(path: string | undefined) {
    // If the path is undefined, return false immediately
	if (!path) return false;
    // Attempt to get the file or directory stats
    // If it exists, statSync will return the stats object
	try {
		statSync(path);
		return true;
	} catch {
		return false;
	}
}

/**
 * Searches for the first existing configuration file in the provided list of paths.
 *
 * @param projectRootUrl - The root URL or directory of the project.
 * @param configPaths - An array of relative paths to potential configuration files.
 * @returns The URL of the first existing configuration file, or `undefined` if none are found.
 */
export function findConfig(projectRootUrl: string, configPaths: string[]) {
    // Iterate through the provided configuration paths
    // For each path, construct the full URL and check if it exists
    // If it exists, return the URL
	for (const path of configPaths) {
		const configUrl = `${projectRootUrl}${path}`;
		if (exists(configUrl)) return configUrl;
	}
    // If no configuration file is found, return undefined
	return undefined;
}

/**
 * Options for watching configuration files.
 *
 * @property configPaths - An array of file paths to configuration files that should be watched.
 */
export interface WatchConfigFileOptions {
	configPaths: string[];
}

/**
 * Watches a configuration file for changes and adds it to the watch list.
 *
 * This utility is defined for the 'astro:config:setup' hook. It locates the configuration
 * file based on the provided root pathname and a list of possible config paths, then
 * registers the found config file with the `addWatchFile` function to enable hot-reloading
 * or rebuilds when the config changes.
 *
 * @param context - An object containing:
 *   - `addWatchFile`: A function to register files to be watched.
 *   - `config.root.pathname`: The root directory pathname to search for config files.
 * @param options - An object containing:
 *   - `configPaths`: An array of possible configuration file paths to search for.
 *
 * @returns void
 */
export const watchConfigFile = defineUtility('astro:config:setup')(
	(
		{
			addWatchFile,
			config: {
				root: { pathname },
			},
		},
		{ configPaths }: WatchConfigFileOptions
	) => {
        // Find the first existing configuration file from the provided paths
        // If a configuration file is found, register it for watching
		const configFileUrl = findConfig(pathname, configPaths);
		if (configFileUrl) {
			addWatchFile(configFileUrl);
		}
		return;
	}
);
