import studioCMS_SDK_GET from './get';
import type { CombinedPageData, SiteConfig } from './types';
import { StudioCMS_SDK_Error } from './utils';

/**
 * Represents a cache object for page data.
 *
 * @interface PageDataCacheObject
 * @property {string} id - The unique identifier for the cache object.
 * @property {Date} lastCacheUpdate - The date and time when the cache was last updated.
 * @property {CombinedPageData} data - The combined data of the page stored in the cache.
 */
export interface PageDataCacheObject {
	id: string;
	lastCacheUpdate: Date;
	data: CombinedPageData;
}

/**
 * Represents a cache object for site configuration.
 *
 * @interface SiteConfigCacheObject
 * @property {Date} lastCacheUpdate - The date when the cache was last updated.
 * @property {SiteConfig} data - The site configuration data.
 */
export interface SiteConfigCacheObject {
	lastCacheUpdate: Date;
	data: SiteConfig;
}

/**
 * Interface representing the cache utility for the STUDIOCMS SDK.
 */
export interface STUDIOCMS_SDK_CACHE {
	/**
	 * Cache retrieval operations.
	 */
	GET: {
		/**
		 * Cache operations related to individual pages.
		 */
		page: {
			/**
			 * Retrieves a page from the cache by its ID.
			 * @param id - The ID of the page.
			 * @returns A promise that resolves to the cached page data.
			 */
			byId: (id: string) => Promise<PageDataCacheObject>;

			/**
			 * Retrieves a page from the cache by its slug and package.
			 * @param slug - The slug of the page.
			 * @param pkg - The package of the page.
			 * @returns A promise that resolves to the cached page data.
			 */
			bySlug: (slug: string, pkg: string) => Promise<PageDataCacheObject>;
		};

		/**
		 * Retrieves all pages from the cache.
		 * @returns A promise that resolves to an array of cached page data.
		 */
		pages: () => Promise<PageDataCacheObject[]>;

		/**
		 * Retrieves the site configuration from the cache.
		 * @returns A promise that resolves to the cached site configuration data.
		 */
		siteConfig: () => Promise<SiteConfigCacheObject>;
	};

	/**
	 * Cache clearing operations.
	 */
	CLEAR: {
		/**
		 * Cache clearing operations related to individual pages.
		 */
		page: {
			/**
			 * Clears a page from the cache by its ID.
			 * @param id - The ID of the page.
			 */
			byId: (id: string) => void;

			/**
			 * Clears a page from the cache by its slug and package.
			 * @param slug - The slug of the page.
			 * @param pkg - The package of the page.
			 */
			bySlug: (slug: string, pkg: string) => void;
		};

		/**
		 * Clears all pages from the cache.
		 */
		pages: () => void;
	};
}

const cache: {
	pages: PageDataCacheObject[];
	siteConfig: SiteConfigCacheObject | undefined;
} = {
	pages: [],
	siteConfig: undefined,
};

// Calculations for cache lifetime in milliseconds

// TODO: Determine appropriate cache lifetime value to use.
// Need to either pick "The best" value or allow the user to configure it.

// const oneMinute = 1000 * 60;
// fiveMinutes = 1000 * 60 * 5;
// tenMinutes = 1000 * 60 * 10;
// fifteenMinutes = 1000 * 60 * 15;
// thirtyMinutes = 1000 * 60 * 30;
// oneHour = 1000 * 60 * 60;
// twentyFourHours = 1000 * 60 * 60 * 24;

const cacheLifetime = 1000 * 60 * 5;

/**
 * Checks if a cache entry has expired based on the current time and the cache lifetime.
 *
 * @param entry - The cache entry to check, which includes the last updated timestamp.
 * @returns `true` if the entry has expired, `false` otherwise.
 */
function isEntryExpired(entry: PageDataCacheObject | SiteConfigCacheObject): boolean {
	return new Date().getTime() - entry.lastCacheUpdate.getTime() > cacheLifetime;
}

export const studioCMS_Cache: STUDIOCMS_SDK_CACHE = {
	GET: {
		page: {
			byId: async (id) => {
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
				const index = cache.pages.findIndex((cachedObject) => cachedObject.id === id);
				if (index !== -1) {
					cache.pages.splice(index, 1);
				}
			},
			bySlug: (slug, pkg) => {
				const index = cache.pages.findIndex(
					(cachedObject) => cachedObject.data.slug === slug && cachedObject.data.package === pkg
				);
				if (index !== -1) {
					cache.pages.splice(index, 1);
				}
			},
		},
		pages: () => {
			cache.pages = [];
		},
	},
};

export default studioCMS_Cache;
