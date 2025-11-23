import { statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
 * @param projectRootUrl - The root URL or directory of the project (can be a file:// URL or file path string).
 * @param configPaths - An array of relative paths to potential configuration files.
 * @returns The full path of the first existing configuration file, or `undefined` if none are found.
 */
export function findConfig(projectRootUrl: string, configPaths: string[]) {
	// Convert URL to file path if needed (handles both URL strings and regular paths)
	const rootPath = projectRootUrl.startsWith('file://')
		? fileURLToPath(projectRootUrl)
		: projectRootUrl;

	// Iterate through the provided configuration paths
	// For each path, construct the full path using path.join for cross-platform compatibility
	// and check if it exists
	for (const path of configPaths) {
		const configPath = join(rootPath, path);
		if (exists(configPath)) return configPath;
	}
	// If no configuration file is found, return undefined
	return undefined;
}
