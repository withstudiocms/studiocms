import type { AstroIntegrationLogger } from 'astro';

/**
 * Fetches the latest version of a given npm package from the npm registry.
 *
 * @param packageName - The name of the npm package to fetch the latest version for.
 * @param logger - An instance of `AstroIntegrationLogger` used to log errors if the fetch fails.
 * @returns A promise that resolves to the latest version of the package as a string,
 *          or `null` if an error occurs during the fetch process.
 *
 * @throws Will throw an error if the HTTP response from the npm registry is not successful.
 */
export async function getLatestVersion(
	packageName: string,
	logger: AstroIntegrationLogger
): Promise<string | null> {
	try {
		const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);

		if (!response.ok) {
			throw new Error(`Failed to fetch package info: ${response.statusText}`);
		}

		const data = await response.json();
		return data.version;
	} catch (error) {
		logger.error(`Error fetching latest version of ${packageName}: ${error}`);
		return null;
	}
}
