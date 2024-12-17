import config from 'studiocms:config';
import { CMSSiteConfigId } from '../consts';
import studioCMS_SDK_GET from './get';
import type {
	CacheObject,
	PageDataCacheObject,
	STUDIOCMS_SDK_CACHE,
	SiteConfigCacheObject,
} from './types';
import studioCMS_SDK_UPDATE from './update';
import { Expire, StudioCMS_SDK_Error } from './utils';

export type { STUDIOCMS_SDK_CACHE, PageDataCacheObject, SiteConfigCacheObject };

const {
	sdk: {
		cacheConfig,
		cacheConfig: { enabled: isEnabled },
	},
} = config;

/**
 * Cache object to store content retrieved from the database.
 */
const cache: CacheObject = {
	pages: [],
	siteConfig: undefined,
};

/**
 * Checks if a cache entry has expired based on the current time and the cache lifetime.
 *
 * @param entry - The cache entry to check, which includes the last updated timestamp.
 * @returns `true` if the entry has expired, `false` otherwise.
 */
const isEntryExpired = Expire(cacheConfig);

export const studioCMS_Cache: STUDIOCMS_SDK_CACHE = {
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

					if (!newData) {
						throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
					}
					const dataToInsert = { id, lastCacheUpdate: new Date(), data: newData };
					cache.pages.push(dataToInsert);
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

					if (!newData) {
						throw new StudioCMS_SDK_Error('Could not retrieve data from the database.');
					}

					const dataToInsert = { id: newData.id, lastCacheUpdate: new Date(), data: newData };
					cache.pages.push(dataToInsert);
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
					const index = cache.pages.findIndex((cachedObject) => cachedObject.id === id);
					if (index !== -1) {
						cache.pages.splice(index, 1);
					}
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
					const index = cache.pages.findIndex(
						(cachedObject) => cachedObject.data.slug === slug && cachedObject.data.package === pkg
					);
					if (index !== -1) {
						cache.pages.splice(index, 1);
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
				cache.pages = [];
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

export default studioCMS_Cache;
