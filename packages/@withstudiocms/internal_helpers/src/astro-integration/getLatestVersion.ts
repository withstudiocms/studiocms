import fs from 'node:fs';
import type { AstroIntegrationLogger } from 'astro';
import { jsonParse } from '../utils/jsonUtils.js';

interface LatestVersionCheck {
	lastChecked: string; // ISO 8601
	version: string;
}

interface CachedData {
	latestVersionCheck?: LatestVersionCheck;
}

interface FileIO {
	readFileSync: typeof fs.readFileSync;
	writeFileSync: typeof fs.writeFileSync;
}

/**
 * Fetches the latest version of a given npm package from the npm registry.
 *
 * @param packageName - The name of the npm package to fetch the latest version for.
 * @param logger - An instance of `AstroIntegrationLogger` used to log errors if the fetch fails.
 * @param cacheJsonFile - File URL for dev-mode cache (optional).
 * @param isDevMode - When true, uses/updates a 1h TTL cache in `cacheJsonFile`.
 * @param io - Optional file IO overrides for testing.
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
	io: FileIO = fs
): Promise<string | null> {
	let cacheData: CachedData = {};

	if (isDevMode && cacheJsonFile) {
		try {
			const file = io.readFileSync(cacheJsonFile, { encoding: 'utf-8' });
			cacheData = jsonParse<CachedData>(file) ?? {};
		} catch (err) {
			// Ignore missing cache; warn on other parse/read errors
			if (!(err as NodeJS.ErrnoException)?.code?.includes('ENOENT')) {
				logger?.warn?.(`Ignoring cache read error for ${cacheJsonFile}: ${(err as Error).message}`);
			}
		}

		if (
			cacheData.latestVersionCheck?.lastChecked &&
			new Date(cacheData.latestVersionCheck.lastChecked).getTime() >
				new Date(Date.now() - 60 * 60 * 1000).getTime()
		) {
			return cacheData.latestVersionCheck.version;
		}
	}

	try {
		const ac = new AbortController();
		const t = setTimeout(() => ac.abort(), 5_000);
		const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
			signal: ac.signal,
		});
		clearTimeout(t);

		if (!response.ok) {
			logger.warn(`Failed to fetch package info from registry.npmjs.org: ${response.statusText}`);
			return null;
		}

		const data = await response.json();

		if (isDevMode && cacheJsonFile) {
			const updatedCacheData: CachedData = {
				...cacheData,
				latestVersionCheck: {
					lastChecked: new Date().toISOString(),
					version: data.version,
				},
			};
			io.writeFileSync(cacheJsonFile, JSON.stringify(updatedCacheData, null, 2), 'utf-8');
		}

		return data.version;
	} catch (error) {
		logger.error(`Error fetching latest version of ${packageName}: ${error}`);
		return null;
	}
}
