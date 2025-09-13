import fs from 'node:fs';
import type { AstroIntegrationLogger } from 'astro';
import { jsonParse } from '../utils/jsonUtils.js';

type LatestVersionCheck = {
	lastChecked: Date;
	version: string;
};

type CachedData = {
	latestVersionCheck?: LatestVersionCheck;
};

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
	logger: AstroIntegrationLogger,
	cacheJsonFile: URL | undefined,
	isDevMode: boolean,
	{
		readFileSync,
		writeFileSync,
	}: { readFileSync: typeof fs.readFileSync; writeFileSync: typeof fs.writeFileSync } = fs
): Promise<string | null> {
	let cacheData: CachedData = {};

	if (isDevMode && cacheJsonFile) {
		const file = readFileSync(cacheJsonFile, { encoding: 'utf-8' });

		cacheData = jsonParse<CachedData>(file);

		if (
			cacheData.latestVersionCheck?.lastChecked &&
			new Date(cacheData.latestVersionCheck.lastChecked).getTime() >
				new Date(Date.now() - 60 * 60 * 1000).getTime()
		) {
			return cacheData.latestVersionCheck.version;
		}
	}

	try {
		const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);

		if (!response.ok) {
			throw new Error(`Failed to fetch package info: ${response.statusText}`);
		}

		const data = await response.json();

		if (isDevMode && cacheJsonFile) {
			const updatedCacheData: CachedData = {
				...cacheData,
				latestVersionCheck: {
					lastChecked: new Date(),
					version: data.version,
				},
			};
			writeFileSync(cacheJsonFile, JSON.stringify(updatedCacheData, null, 2), 'utf-8');
		}

		return data.version;
	} catch (error) {
		logger.error(`Error fetching latest version of ${packageName}: ${error}`);
		return null;
	}
}
