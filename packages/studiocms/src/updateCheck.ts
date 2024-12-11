import { defineUtility } from 'astro-integration-kit';
import packageJson from 'package-json';
import * as semver from 'semver';

/**
 * Fetches the latest version of a package from the npm registry.
 * @param packageName - The name of the package.
 * @returns A promise that resolves to the latest version of the package.
 */
async function fetchLatestVersion(packageName: string): Promise<string> {
	const { version } = await packageJson(packageName.toLowerCase());
	return version;
}

/**
 * Checks for updates of a specified package on npm registry.
 * @param {import("astro").HookParameters<"astro:config:setup">} params - The Astro parameters object.
 * @param currentVersion - The current version of the package.
 */
export const updateCheck = defineUtility('astro:server:start')(
	async (params, name: string, currentVersion: string): Promise<void> => {
		const logger = params.logger.fork(`${name}:update-check`);

		try {
			const latestVersion = await fetchLatestVersion(name);

			const comparison = semver.compare(currentVersion, latestVersion);

			if (comparison === -1) {
				logger.warn(
					`A new version of 'studiocms' is available. Please update to ${latestVersion} using your favorite package manager.`
				);
			} else if (comparison === 0) {
				logger.info(`You are using the latest version of '${name}' (${currentVersion})`);
			} else {
				logger.info(
					`You are using a newer version (${currentVersion}) of '${name}' than the latest release (${latestVersion})`
				);
			}
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error fetching latest version from npm registry: ${error.message}`);
			} else {
				// Handle the case where error is not an Error object
				logger.error(
					'An unknown error occurred while fetching the latest version from the npm registry.'
				);
			}
		}
	}
);
