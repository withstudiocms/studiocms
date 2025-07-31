import { statSync } from 'node:fs';

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
