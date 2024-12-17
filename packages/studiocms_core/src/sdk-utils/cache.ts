import { CMSSiteConfigId } from '../consts';
import studioCMS_SDK_GET from './get';
import type { CacheConfig, CacheObject, STUDIOCMS_SDK_CACHE } from './types';
import studioCMS_SDK_UPDATE from './update';
import { Expire, StudioCMS_SDK_Error } from './utils';

export type { STUDIOCMS_SDK_CACHE };

/**
 * Configuration object for cache settings.
 *
 * @property {boolean} enabled - Indicates whether caching is enabled.
 * @property {string} lifetime - Specifies the duration for which the cache is valid.
 *                               The value should be in a human-readable format (e.g., '5m' for 5 minutes).
 */
const cacheConfig: CacheConfig = {
	enabled: true,
	// TODO: Determine appropriate cache lifetime value to use.
	// Need to either pick "The best" value or allow the user to configure it.
	lifetime: '5m',
};

/**
 * Cache object to store content retrieved from the database.
 */
const cache: CacheObject = {
	pages: [],
	siteConfig: undefined,
};

const isEntryExpired = Expire(cacheConfig);

export const studioCMS_Cache: STUDIOCMS_SDK_CACHE = {
	GET: {
		page: {
			byId: async (id) => {
				if (!cacheConfig.enabled) {
					const pageData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

					if (!pageData) {
						throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
					}
					return {
						id,
						lastCacheUpdate: new Date(),
						data: pageData,
					};
				}

				const isCached = cache.pages.find((cachedObject) => cachedObject.id === id);

				if (isCached && !isEntryExpired(isCached)) {
					return isCached;
				}

				if (isCached && isEntryExpired(isCached)) {
					const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);
					if (updatedData) {
						isCached.lastCacheUpdate = new Date();
						isCached.data = updatedData;
						return isCached;
					}
					throw new StudioCMS_SDK_Error('Cache entry expired and could not be updated.');
				}

				const newData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

				if (newData) {
					const dataToInsert = { id, lastCacheUpdate: new Date(), data: newData };
					cache.pages.push(dataToInsert);
					return dataToInsert;
				}

				throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
			},
			bySlug: async (slug, pkg) => {
				if (!cacheConfig.enabled) {
					const pageData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);

					if (!pageData) {
						throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
					}
					return {
						id: pageData.id,
						lastCacheUpdate: new Date(),
						data: pageData,
					};
				}
				const isCached = cache.pages.find(
					(cachedObject) => cachedObject.data.slug === slug && cachedObject.data.package === pkg
				);

				if (isCached && !isEntryExpired(isCached)) {
					return isCached;
				}

				if (isCached && isEntryExpired(isCached)) {
					const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);
					if (updatedData) {
						isCached.lastCacheUpdate = new Date();
						isCached.data = updatedData;
						return isCached;
					}
					throw new StudioCMS_SDK_Error('Cache entry expired and could not be updated.');
				}

				const newData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);

				if (newData) {
					const dataToInsert = { id: newData.id, lastCacheUpdate: new Date(), data: newData };
					cache.pages.push(dataToInsert);
					return dataToInsert;
				}

				throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
			},
		},
		pages: async () => {
			if (!cacheConfig.enabled) {
				const pages = await studioCMS_SDK_GET.database.pages();

				if (!pages) {
					throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
				}
				return pages.map((data) => ({ id: data.id, lastCacheUpdate: new Date(), data }));
			}
			// Check if cache is empty
			if (cache.pages.length === 0) {
				const updatedData = await studioCMS_SDK_GET.database.pages();
				if (updatedData) {
					cache.pages = updatedData.map((data) => ({
						id: data.id,
						lastCacheUpdate: new Date(),
						data,
					}));
					return cache.pages;
				}
				throw new StudioCMS_SDK_Error('Cache is empty and could not be updated.');
			}

			// Check if any cache entry is expired
			for (const page of cache.pages) {
				if (isEntryExpired(page)) {
					const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(page.id);
					if (updatedData) {
						page.lastCacheUpdate = new Date();
						page.data = updatedData;
					}
				}
			}

			// Get current pages in the database
			const currentPagesInDB = await studioCMS_SDK_GET.database.pages();

			// Check if the number of pages in the database has changed
			if (currentPagesInDB.length !== cache.pages.length) {
				const updatedData = await studioCMS_SDK_GET.database.pages();
				if (updatedData) {
					cache.pages = updatedData.map((data) => ({
						id: data.id,
						lastCacheUpdate: new Date(),
						data,
					}));
					return cache.pages;
				}
				throw new StudioCMS_SDK_Error('Cache entry expired and could not be updated.');
			}

			return cache.pages.map((cachedObject) => cachedObject);
		},
		siteConfig: async () => {
			if (!cacheConfig.enabled) {
				const siteConfig = await studioCMS_SDK_GET.database.config();

				if (!siteConfig) {
					throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
				}
				return { lastCacheUpdate: new Date(), data: siteConfig };
			}

			if (!cache.siteConfig) {
				const updatedData = await studioCMS_SDK_GET.database.config();
				if (updatedData) {
					cache.siteConfig = { lastCacheUpdate: new Date(), data: updatedData };
					return cache.siteConfig;
				}
				throw new StudioCMS_SDK_Error('Cache is empty and could not be updated.');
			}

			if (isEntryExpired(cache.siteConfig)) {
				const updatedData = await studioCMS_SDK_GET.database.config();
				if (updatedData) {
					cache.siteConfig.lastCacheUpdate = new Date();
					cache.siteConfig.data = updatedData;
					return cache.siteConfig;
				}
				throw new StudioCMS_SDK_Error('Cache entry expired and could not be updated.');
			}

			return cache.siteConfig;
		},
	},
	CLEAR: {
		page: {
			byId: (id) => {
				if (!cacheConfig.enabled) {
					return;
				}
				const index = cache.pages.findIndex((cachedObject) => cachedObject.id === id);
				if (index !== -1) {
					cache.pages.splice(index, 1);
				}
			},
			bySlug: (slug, pkg) => {
				if (!cacheConfig.enabled) {
					return;
				}
				const index = cache.pages.findIndex(
					(cachedObject) => cachedObject.data.slug === slug && cachedObject.data.package === pkg
				);
				if (index !== -1) {
					cache.pages.splice(index, 1);
				}
			},
		},
		pages: () => {
			if (!cacheConfig.enabled) {
				return;
			}
			cache.pages = [];
		},
	},
	UPDATE: {
		page: {
			byId: async (id, { pageData, pageContent }) => {
				if (!cacheConfig.enabled) {
					await studioCMS_SDK_UPDATE.page(pageData);
					await studioCMS_SDK_UPDATE.pageContent(pageContent);

					const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

					if (!updatedData) {
						throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
					}

					return { id, lastCacheUpdate: new Date(), data: updatedData };
				}
				const isCached = cache.pages.find((cachedObject) => cachedObject.id === id);
				if (!isCached) {
					throw new StudioCMS_SDK_Error('Cache entry does not exist.');
				}
				await studioCMS_SDK_UPDATE.page(pageData);
				await studioCMS_SDK_UPDATE.pageContent(pageContent);

				const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

				if (!updatedData) {
					throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
				}

				isCached.lastCacheUpdate = new Date();
				isCached.data = updatedData;

				return isCached;
			},
			bySlug: async (slug, pkg, { pageData, pageContent }) => {
				if (!cacheConfig.enabled) {
					await studioCMS_SDK_UPDATE.page(pageData);
					await studioCMS_SDK_UPDATE.pageContent(pageContent);

					const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);

					if (!updatedData) {
						throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
					}

					return { id: updatedData.id, lastCacheUpdate: new Date(), data: updatedData };
				}
				const isCached = cache.pages.find(
					(cachedObject) => cachedObject.data.slug === slug && cachedObject.data.package === pkg
				);

				if (!isCached) {
					throw new StudioCMS_SDK_Error('Cache entry does not exist.');
				}

				try {
					await studioCMS_SDK_UPDATE.page(pageData);
					await studioCMS_SDK_UPDATE.pageContent(pageContent);
				} catch (error) {
					if (error instanceof StudioCMS_SDK_Error) {
						throw new StudioCMS_SDK_Error(error.message);
					}
					throw new StudioCMS_SDK_Error('Could not update page data in the database.');
				}

				const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);

				if (!updatedData) {
					throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
				}

				isCached.lastCacheUpdate = new Date();
				isCached.data = updatedData;

				return isCached;
			},
		},
		siteConfig: async (data) => {
			const newConfig = await studioCMS_SDK_UPDATE.siteConfig({ ...data, id: CMSSiteConfigId });

			if (!newConfig) {
				throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
			}

			if (!cacheConfig.enabled) {
				return { lastCacheUpdate: new Date(), data: newConfig };
			}

			cache.siteConfig = { lastCacheUpdate: new Date(), data: newConfig };

			return cache.siteConfig;
		},
	},
};

export default studioCMS_Cache;
