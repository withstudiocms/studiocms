import { sdk } from 'studiocms:config';
import { CMSSiteConfigId } from '../consts';
import studioCMS_SDK_GET from './get';
import type {
	PageDataCacheObject,
	STUDIOCMS_SDK_CACHE,
	SiteConfigCacheObject,
	StudioCMSCacheObject,
} from './types';
import studioCMS_SDK_UPDATE from './update';
import { Expire, StudioCMS_SDK_Error } from './utils';

export type { STUDIOCMS_SDK_CACHE, PageDataCacheObject, SiteConfigCacheObject };

const {
	cacheConfig,
	cacheConfig: { enabled: isEnabled },
} = sdk;

const pagesCacheMap = new Map<string, PageDataCacheObject>();

/**
 * Cache object to store content retrieved from the database.
 */
const cache: StudioCMSCacheObject = {
	pages: pagesCacheMap,
	siteConfig: undefined,
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
					if (!isEnabled) {
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

					const isCached = cache.pages.get(id);

					if (isCached && !isEntryExpired(isCached)) {
						return isCached;
					}

					if (isCached && isEntryExpired(isCached)) {
						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);
						if (updatedData) {
							cache.pages.set(id, { lastCacheUpdate: new Date(), data: updatedData });
							return { id, lastCacheUpdate: new Date(), data: updatedData };
						}
						throw new StudioCMS_SDK_Error('Cache entry expired and could not be updated.');
					}

					const newData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

					if (!newData) {
						throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
					}
					const dataToInsert = { lastCacheUpdate: new Date(), data: newData };
					cache.pages.set(id, dataToInsert);
					return dataToInsert;
				} catch (error) {
					if (error instanceof StudioCMS_SDK_Error) {
						throw new StudioCMS_SDK_Error(error.message);
					}
					throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
				}
			},
			bySlug: async (slug, pkg) => {
				try {
					if (!isEnabled) {
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
					const cacheMap = cache.pages.values();
					const cacheArray = Array.from(cacheMap);
					const isCached = cacheArray.find(
						(cachedObject) => cachedObject.data.slug === slug && cachedObject.data.package === pkg
					);
					if (isCached && !isEntryExpired(isCached)) {
						return isCached;
					}

					if (isCached && isEntryExpired(isCached)) {
						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);
						if (updatedData) {
							cache.pages.set(updatedData.id, { lastCacheUpdate: new Date(), data: updatedData });
							return { id: updatedData.id, lastCacheUpdate: new Date(), data: updatedData };
						}
						throw new StudioCMS_SDK_Error('Cache entry expired and could not be updated.');
					}

					const newData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);

					if (!newData) {
						throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
					}

					const dataToInsert = { lastCacheUpdate: new Date(), data: newData };
					cache.pages.set(newData.id, dataToInsert);
					return dataToInsert;
				} catch (error) {
					if (error instanceof StudioCMS_SDK_Error) {
						throw new StudioCMS_SDK_Error(error.message);
					}
					throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
				}
			},
		},
		pages: async () => {
			try {
				if (!isEnabled) {
					const pages = await studioCMS_SDK_GET.database.pages();

					if (!pages) {
						throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
					}
					return pages.map((data) => ({ lastCacheUpdate: new Date(), data }));
				}
				// Check if cache is empty
				if (cache.pages.size === 0) {
					const updatedData = await studioCMS_SDK_GET.database.pages();
					if (updatedData) {
						for (const data of updatedData) {
							cache.pages.set(data.id, { lastCacheUpdate: new Date(), data });
						}
						return updatedData.map((data) => ({ lastCacheUpdate: new Date(), data }));
					}
					throw new StudioCMS_SDK_Error('Cache is empty and could not be updated.');
				}

				// Check if any cache entry is expired
				for (const [, page] of cache.pages) {
					if (isEntryExpired(page)) {
						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(page.data.id);
						if (updatedData) {
							page.lastCacheUpdate = new Date();
							page.data = updatedData;
						}
					}
				}

				// Get current pages in the database
				const currentPagesInDB = await studioCMS_SDK_GET.database.pages();

				// Check if the number of pages in the database has changed
				if (currentPagesInDB.length !== cache.pages.size) {
					const updatedData = await studioCMS_SDK_GET.database.pages();
					if (updatedData) {
						cache.pages.clear();
						for (const data of updatedData) {
							cache.pages.set(data.id, { lastCacheUpdate: new Date(), data });
						}
						return updatedData.map((data) => ({ id: data.id, lastCacheUpdate: new Date(), data }));
					}
					throw new StudioCMS_SDK_Error('Cache entry expired and could not be updated.');
				}

				// Return all cached pages
				const cacheMap = cache.pages.values();
				const cacheArray = Array.from(cacheMap);
				const cacheRemapped = cacheArray.map((cachedObject) => cachedObject.data);
				return cacheRemapped.map((data) => ({ lastCacheUpdate: new Date(), data }));
			} catch (error) {
				if (error instanceof StudioCMS_SDK_Error) {
					throw new StudioCMS_SDK_Error(error.message);
				}
				throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
			}
		},
		siteConfig: async () => {
			try {
				if (!isEnabled) {
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
			} catch (error) {
				if (error instanceof StudioCMS_SDK_Error) {
					throw new StudioCMS_SDK_Error(error.message);
				}
				throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
			}
		},
	},
	CLEAR: {
		page: {
			byId: (id) => {
				try {
					if (!isEnabled) {
						return;
					}
					cache.pages.delete(id);
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error clearing cache: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error clearing cache: An unknown error occurred.');
				}
			},
			bySlug: (slug, pkg) => {
				try {
					if (!isEnabled) {
						return;
					}
					const index = [];
					for (const [key, cachedObject] of cache.pages.entries()) {
						if (cachedObject.data.slug === slug && cachedObject.data.package === pkg) {
							index.push(key);
						}
					}
					for (const i of index) {
						cache.pages.delete(i);
					}
				} catch (error) {
					if (error instanceof Error) {
						throw new StudioCMS_SDK_Error(`Error clearing cache: ${error.message}`, error.stack);
					}
					throw new StudioCMS_SDK_Error('Error clearing cache: An unknown error occurred.');
				}
			},
		},
		pages: () => {
			try {
				if (!isEnabled) {
					return;
				}
				cache.pages.clear();
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMS_SDK_Error(`Error clearing cache: ${error.message}`, error.stack);
				}
				throw new StudioCMS_SDK_Error('Error clearing cache: An unknown error occurred.');
			}
		},
	},
	UPDATE: {
		page: {
			byId: async (id, { pageData, pageContent }) => {
				try {
					if (!isEnabled) {
						await studioCMS_SDK_UPDATE.page(pageData);
						await studioCMS_SDK_UPDATE.pageContent(pageContent);

						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

						if (!updatedData) {
							throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
						}

						return { id, lastCacheUpdate: new Date(), data: updatedData };
					}
					const isCached = cache.pages.get(id);
					if (!isCached) {
						throw new StudioCMS_SDK_Error('Cache entry does not exist.');
					}
					await studioCMS_SDK_UPDATE.page(pageData);
					await studioCMS_SDK_UPDATE.pageContent(pageContent);

					const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.byId(id);

					if (!updatedData) {
						throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
					}

					cache.pages.set(id, { lastCacheUpdate: new Date(), data: updatedData });

					return { id, lastCacheUpdate: new Date(), data: updatedData };
				} catch (error) {
					if (error instanceof StudioCMS_SDK_Error) {
						throw new StudioCMS_SDK_Error(error.message);
					}
					throw new StudioCMS_SDK_Error('Could not update page data in the database.');
				}
			},
			bySlug: async (slug, pkg, { pageData, pageContent }) => {
				try {
					if (!isEnabled) {
						await studioCMS_SDK_UPDATE.page(pageData);
						await studioCMS_SDK_UPDATE.pageContent(pageContent);

						const updatedData = await studioCMS_SDK_GET.databaseEntry.pages.bySlug(slug, pkg);

						if (!updatedData) {
							throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
						}

						return { id: updatedData.id, lastCacheUpdate: new Date(), data: updatedData };
					}
					const cacheMap = cache.pages.values();
					const cacheArray = Array.from(cacheMap);
					const isCached = cacheArray.find(
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

					const dataToInsert = { lastCacheUpdate: new Date(), data: updatedData };

					cache.pages.set(updatedData.id, dataToInsert);

					return { id: updatedData.id, lastCacheUpdate: new Date(), data: updatedData };
				} catch (error) {
					if (error instanceof StudioCMS_SDK_Error) {
						throw new StudioCMS_SDK_Error(error.message);
					}
					throw new StudioCMS_SDK_Error('Could not update page data in the database.');
				}
			},
		},
		siteConfig: async (data) => {
			try {
				const newConfig = await studioCMS_SDK_UPDATE.siteConfig({ ...data, id: CMSSiteConfigId });

				if (!newConfig) {
					throw new StudioCMS_SDK_Error('Could not retrieve updated data from the database.');
				}

				if (!isEnabled) {
					return { lastCacheUpdate: new Date(), data: newConfig };
				}

				cache.siteConfig = { lastCacheUpdate: new Date(), data: newConfig };

				return cache.siteConfig;
			} catch (error) {
				if (error instanceof StudioCMS_SDK_Error) {
					throw new StudioCMS_SDK_Error(error.message);
				}
				throw new StudioCMS_SDK_Error('Could not update site config in the database.');
			}
		},
	},
};

export default studioCMS_SDK_Cache;
