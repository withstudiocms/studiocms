import { sdk } from 'studiocms:config';
import studioCMS_SDK from '.';
import { CMSSiteConfigId, versionCacheLifetime } from '../consts';
import { StudioCMSCache } from './StudioCMSCache';
import studioCMS_SDK_GET from './get';
import type {
	PageDataCacheObject,
	STUDIOCMS_SDK_CACHE,
	SiteConfigCacheObject,
	StudioCMSCacheObject,
	VersionCacheObject,
} from './types';
import studioCMS_SDK_UPDATE from './update';
import {
	Expire,
	StudioCMS_SDK_Error,
	cacheMapSet,
	getLatestVersion,
	handleSDKError,
	isCacheExpired,
	transformNewDataReturn,
	transformSiteConfigReturn,
} from './utils';

export type { STUDIOCMS_SDK_CACHE, PageDataCacheObject, SiteConfigCacheObject };

const {
	cacheConfig,
	cacheConfig: { enabled: isEnabled },
} = sdk;

/**
 * A map that caches page data objects.
 *
 * The key is a string representing the page identifier.
 * The value is a `PageDataCacheObject` containing the cached data for the page.
 */
const pagesCacheMap = new Map<string, PageDataCacheObject>();

const siteConfigCacheMap = new Map<string, SiteConfigCacheObject>();

const versionCacheMap = new Map<string, VersionCacheObject>();

const VirtualCache = new StudioCMSCache(
	pagesCacheMap,
	siteConfigCacheMap,
	versionCacheMap,
	cacheConfig,
	studioCMS_SDK,
	CMSSiteConfigId,
	versionCacheLifetime
);

/**
 * Cache object to store content retrieved from the database.
 */
const cache: StudioCMSCacheObject = {
	pages: pagesCacheMap,
	siteConfig: undefined,
	version: undefined,
};

/**
 * Checks if a cache entry has expired based on the current time and the cache lifetime.
 *
 * @param entry - The cache entry to check, which includes the last updated timestamp.
 * @returns `true` if the entry has expired, `false` otherwise.
 */
const isEntryExpired = Expire(cacheConfig);

export const studioCMS_SDK_Cache: STUDIOCMS_SDK_CACHE = {
	GET: {
		page: {
			byId: async (id) => {
				try {
					// Check if caching is disabled
					if (!isEnabled) {
						// Retrieve the data from the database
						const pageData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

						// Check if the data was retrieved successfully
						if (!pageData) {
							throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
						}

						// Transform and return the data
						return transformNewDataReturn(pageData);
					}

					// Check if the cache entry exists
					const isCached = cache.pages.get(id);

					// If the cache entry does not exist, retrieve the data from the database
					if (!isCached) {
						// Retrieve the data from the database
						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

						// Check if the data was retrieved successfully
						if (!updatedData) {
							throw new StudioCMS_SDK_Error('Cache entry does not exist.');
						}
						// Store the data in the cache
						cacheMapSet(cache.pages, id, updatedData);

						// Return the transformed data
						return transformNewDataReturn(updatedData);
					}

					// If the cache entry is expired, update the data
					if (isEntryExpired(isCached)) {
						// Retrieve the data from the database
						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

						// Check if the data was retrieved successfully
						if (!updatedData) {
							throw new StudioCMS_SDK_Error('Cache entry expired and could not be updated.');
						}

						// Store the updated data in the cache
						cacheMapSet(cache.pages, id, updatedData);

						// Return the transformed data
						return transformNewDataReturn(updatedData);
					}

					// Return the cached data
					return isCached;
				} catch (error) {
					handleSDKError(error, 'Could not retrieve data from the database.');
				}
			},
			bySlug: async (slug, pkg) => {
				try {
					// Check if caching is disabled
					if (!isEnabled) {
						// Retrieve the data from the database
						const pageData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);

						// Check if the data was retrieved successfully
						if (!pageData) {
							throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
						}

						// Transform and return the data
						return transformNewDataReturn(pageData);
					}

					// Get the cache map
					const cacheMap = cache.pages.values();

					// Convert the cache map to an array
					const cacheArray = Array.from(cacheMap);

					// Check if the cache entry exists
					const isCached = cacheArray.find(
						(cachedObject) => cachedObject.data.slug === slug && cachedObject.data.package === pkg
					);

					// If the cache entry does not exist, retrieve the data from the database
					if (!isCached) {
						// Retrieve the data from the database
						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);

						// Check if the data was retrieved successfully
						if (!updatedData) {
							throw new StudioCMS_SDK_Error('Cache entry does not exist.');
						}

						// Store the data in the cache
						cacheMapSet(cache.pages, updatedData.id, updatedData);

						// Return the transformed data
						return transformNewDataReturn(updatedData);
					}

					// Check if the cache entry is expired
					if (isEntryExpired(isCached)) {
						// Retrieve the data from the database
						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);

						// Check if the data was retrieved successfully
						if (!updatedData) {
							throw new StudioCMS_SDK_Error('Cache entry expired and could not be updated.');
						}

						// Store the updated data in the cache
						cacheMapSet(cache.pages, updatedData.id, updatedData);

						// Return the transformed data
						return transformNewDataReturn(updatedData);
					}

					// Return the cached data
					return isCached;
				} catch (error) {
					handleSDKError(error, 'Could not retrieve data from the database.');
				}
			},
		},
		pages: async () => {
			try {
				// Check if caching is disabled
				if (!isEnabled) {
					// Retrieve the data from the database
					const pages = await studioCMS_SDK_GET.database.pages();

					// Check if the data was retrieved successfully
					if (!pages) {
						throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
					}

					// Transform and return the data
					return pages.map((data) => transformNewDataReturn(data));
				}

				// Check if cache is empty
				if (cache.pages.size === 0) {
					// Retrieve the data from the database
					const updatedData = await studioCMS_SDK_GET.database.pages();

					// Check if the data was retrieved successfully
					if (!updatedData) {
						throw new StudioCMS_SDK_Error('Cache is empty and could not be updated.');
					}

					// Loop through the updated data and store it in the cache
					for (const data of updatedData) {
						cacheMapSet(cache.pages, data.id, data);
					}

					// Transform and return the data
					return updatedData.map((data) => transformNewDataReturn(data));
				}

				// Get the cache map
				const cacheMap = cache.pages.values();

				// Convert the cache map to an array
				const cacheArray = Array.from(cacheMap);

				// Loop through the cache array and update expired entries
				for (const cachedObject of cacheArray) {
					if (isEntryExpired(cachedObject)) {
						// Retrieve the data from the database
						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(
							cachedObject.data.id
						);
						// Check if the data was retrieved successfully and update the cache
						if (updatedData) {
							cacheMapSet(cache.pages, updatedData.id, updatedData);
						}
					}
				}

				// Grab the values from the cache map
				const grabRecentCache = cache.pages.values();

				// Convert the cache map to an array
				const recentCacheArray = Array.from(grabRecentCache);

				// Transform and return the data
				return recentCacheArray;
			} catch (error) {
				handleSDKError(error, 'Could not retrieve data from the database.');
			}
		},
		siteConfig: async () => {
			try {
				// Check if caching is disabled
				if (!isEnabled) {
					// Retrieve the data from the database
					const siteConfig = await studioCMS_SDK_GET.database.config();

					// Check if the data was retrieved successfully
					if (!siteConfig) {
						throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
					}

					// Transform and return
					return transformSiteConfigReturn(siteConfig);
				}

				// Check if the cache entry exists
				if (!cache.siteConfig) {
					// Retrieve the data from the database
					const updatedData = await studioCMS_SDK_GET.database.config();

					// Check if the data was retrieved successfully
					if (!updatedData) {
						throw new StudioCMS_SDK_Error('Cache is empty and could not be updated.');
					}

					// Store the data in the cache
					cache.siteConfig = transformSiteConfigReturn(updatedData);

					// Return the data
					return cache.siteConfig;
				}

				// Check if the cache entry is expired
				if (isEntryExpired(cache.siteConfig)) {
					// Retrieve the data from the database
					const updatedData = await studioCMS_SDK_GET.database.config();

					// Check if the data was retrieved successfully
					if (!updatedData) {
						throw new StudioCMS_SDK_Error('Cache entry expired and could not be updated.');
					}

					// Update the cache entry
					cache.siteConfig.lastCacheUpdate = new Date();
					cache.siteConfig.data = updatedData;

					// Return the data
					return cache.siteConfig;
				}

				// Return the cached data
				return cache.siteConfig;
			} catch (error) {
				handleSDKError(error, 'Could not retrieve data from the database.');
			}
		},
		latestVersion: async () => {
			try {
				if (!isEnabled) {
					const version = await getLatestVersion();

					return {
						lastCacheUpdate: new Date(),
						version: version,
					};
				}
				if (!cache.version) {
					const version = await getLatestVersion();

					cache.version = {
						lastCacheUpdate: new Date(),
						version: version,
					};

					return cache.version;
				}

				if (isCacheExpired(cache.version.lastCacheUpdate, versionCacheLifetime)) {
					const version = await getLatestVersion();

					cache.version = {
						lastCacheUpdate: new Date(),
						version: version,
					};

					return cache.version;
				}

				return cache.version;
			} catch (error) {
				handleSDKError(error, 'Could not retrieve version data from the database.');
			}
		},
	},
	CLEAR: {
		page: {
			byId: (id) => {
				try {
					// Check if caching is disabled
					if (!isEnabled) {
						// if caching is disabled, return
						return;
					}
					// if caching is enabled, delete the cache entry
					cache.pages.delete(id);
				} catch (error) {
					handleSDKError(error, 'Error clearing cache: An unknown error occurred.');
				}
			},
			bySlug: (slug, pkg) => {
				try {
					// Check if caching is disabled
					if (!isEnabled) {
						// if caching is disabled, return
						return;
					}

					// Key index to store the keys of the cache entries to be deleted
					const keyIndex = [];

					// Loop through the cache entries and store the keys of the cache entries to be deleted
					for (const [key, cachedObject] of cache.pages.entries()) {
						// Check if the cache entry matches the slug and package identifier
						if (cachedObject.data.slug === slug && cachedObject.data.package === pkg) {
							// Store the key of the cache entry to be deleted
							keyIndex.push(key);
						}
					}

					// Loop through the key index and delete the cache entries
					for (const key of keyIndex) {
						// Delete the cache entry
						cache.pages.delete(key);
					}
				} catch (error) {
					handleSDKError(error, 'Error clearing cache: An unknown error occurred.');
				}
			},
		},
		pages: () => {
			try {
				// Check if caching is disabled
				if (!isEnabled) {
					// if caching is disabled, return
					return;
				}
				// if caching is enabled, clear the cache
				cache.pages.clear();
			} catch (error) {
				handleSDKError(error, 'Error clearing cache: An unknown error occurred.');
			}
		},
		latestVersion: () => {
			try {
				// Check if caching is disabled
				if (!isEnabled) {
					// if caching is disabled, return
					return;
				}
				// if caching is enabled, clear the cache
				cache.version = undefined;
			} catch (error) {
				handleSDKError(error, 'Error clearing cache: An unknown error occurred.');
			}
		},
	},
	UPDATE: {
		page: {
			byId: async (id, { pageData, pageContent }) => {
				try {
					// Check if caching is disabled
					if (!isEnabled) {
						// Update the page data in the database
						await studioCMS_SDK_UPDATE.page(pageData);
						await studioCMS_SDK_UPDATE.pageContent(pageContent);

						// Retrieve the updated data from the database
						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

						// Check if the data was retrieved successfully
						if (!updatedData) {
							throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
						}

						// Transform and return the data
						return transformNewDataReturn(updatedData);
					}

					// Check if the cache entry exists
					const isCached = cache.pages.get(id);

					// If the cache entry does not exist, throw an error
					if (!isCached) {
						throw new StudioCMS_SDK_Error('Cache entry does not exist.');
					}

					// Update the page data in the database
					await studioCMS_SDK_UPDATE.page(pageData);
					await studioCMS_SDK_UPDATE.pageContent(pageContent);

					// Retrieve the updated data from the database
					const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

					// Check if the data was retrieved successfully
					if (!updatedData) {
						throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
					}

					// Store the updated data in the cache
					cacheMapSet(cache.pages, id, updatedData);

					// Return the transformed data
					return transformNewDataReturn(updatedData);
				} catch (error) {
					handleSDKError(error, 'Could not update page data in the database.');
				}
			},
			bySlug: async (slug, pkg, { pageData, pageContent }) => {
				try {
					// Check if caching is disabled
					if (!isEnabled) {
						// Update the page data in the database
						await studioCMS_SDK_UPDATE.page(pageData);
						await studioCMS_SDK_UPDATE.pageContent(pageContent);

						// Retrieve the updated data from the database
						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);

						// Check if the data was retrieved successfully
						if (!updatedData) {
							throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
						}

						// Transform and return the data
						return transformNewDataReturn(updatedData);
					}

					// Get the cache map
					const cacheMap = cache.pages.values();

					// Convert the cache map to an array
					const cacheArray = Array.from(cacheMap);

					// Check if the cache entry exists
					const isCached = cacheArray.find(
						(cachedObject) => cachedObject.data.slug === slug && cachedObject.data.package === pkg
					);

					// If the cache entry does not exist, throw an error
					if (!isCached) {
						throw new StudioCMS_SDK_Error('Cache entry does not exist.');
					}

					// Update the page data in the database
					try {
						await studioCMS_SDK_UPDATE.page(pageData);
						await studioCMS_SDK_UPDATE.pageContent(pageContent);
					} catch (error) {
						handleSDKError(error, 'Could not update page data in the database.');
					}

					// Retrieve the updated data from the database
					const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);

					// Check if the data was retrieved successfully
					if (!updatedData) {
						throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
					}

					// Store the updated data in the cache
					cacheMapSet(cache.pages, updatedData.id, updatedData);

					// Return the transformed data
					return transformNewDataReturn(updatedData);
				} catch (error) {
					handleSDKError(error, 'Could not update page data in the database.');
				}
			},
		},
		siteConfig: async (data) => {
			try {
				// Update the site config in the database
				const newConfig = await studioCMS_SDK_UPDATE.siteConfig({ ...data, id: CMSSiteConfigId });

				// Check if the data was returned successfully
				if (!newConfig) {
					throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
				}

				// Check if caching is disabled
				if (!isEnabled) {
					// Transform and return the data
					return transformSiteConfigReturn(newConfig);
				}

				// Update the cache entry
				cache.siteConfig = transformSiteConfigReturn(newConfig);

				// Return the updated data
				return cache.siteConfig;
			} catch (error) {
				handleSDKError(error, 'Could not update site config in the database.');
			}
		},
		latestVersion: async () => {
			try {
				if (!isEnabled) {
					const version = await getLatestVersion();

					return {
						lastCacheUpdate: new Date(),
						version: version,
					};
				}
				const version = await getLatestVersion();

				cache.version = {
					lastCacheUpdate: new Date(),
					version: version,
				};

				return cache.version;
			} catch (error) {
				handleSDKError(error, 'Could not retrieve version data from the database.');
			}
		},
	},
};

export default studioCMS_SDK_Cache;
