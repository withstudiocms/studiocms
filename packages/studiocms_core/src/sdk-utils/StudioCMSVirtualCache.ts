import { CMSSiteConfigId, versionCacheLifetime } from '../consts';
import { StudioCMSCacheError } from './errors';
import type {
	BaseCacheObject,
	CombinedPageData,
	FolderNode,
	FolderTreeCacheObject,
	PageDataCacheObject,
	ProcessedCacheConfig,
	STUDIOCMS_SDK,
	SiteConfig,
	SiteConfigCacheObject,
	VersionCacheObject,
	tsPageContentSelect,
	tsPageDataSelect,
} from './types';

/**
 * The `StudioCMSVirtualCache` class provides caching utilities for the StudioCMS SDK.
 * It supports caching for site configurations, versions, and page data.
 *
 * @class
 * @classdesc This class handles caching operations for the StudioCMS SDK, including
 * fetching, updating, and clearing cache entries for site configurations, versions,
 * and page data.
 *
 * @param {ProcessedCacheConfig} cacheConfig - The configuration for the cache.
 * @param {STUDIOCMS_SDK} studioCMS_SDK - The StudioCMS SDK instance.
 */
export class StudioCMSVirtualCache {
	private readonly SiteConfigMapID: string = '__StudioCMS_Site_Config';
	private readonly VersionMapID: string = '__StudioCMS_Latest_Version';
	private readonly FolderTreeMapID: string = '__StudioCMS_Folder_Tree';
	private readonly PageFolderTreeMapID: string = '__StudioCMS_Page_Folder_Tree';
	private readonly StudioCMSPkgId: string = 'studiocms';
	private readonly CMSSiteConfigId = CMSSiteConfigId;
	private readonly versionCacheLifetime = versionCacheLifetime;

	private readonly cacheConfig: ProcessedCacheConfig;
	private readonly sdk: STUDIOCMS_SDK;

	private pages = new Map<string, PageDataCacheObject>();
	private siteConfig = new Map<string, SiteConfigCacheObject>();
	private version = new Map<string, VersionCacheObject>();
	private folderTree = new Map<string, FolderTreeCacheObject>();
	private pageFolderTree = new Map<string, FolderTreeCacheObject>();

	constructor(cacheConfig: ProcessedCacheConfig, sdkCore: STUDIOCMS_SDK) {
		this.cacheConfig = cacheConfig;
		this.sdk = sdkCore;
	}

	// Misc Utils

	/**
	 * Checks if the cache entry has expired based on the provided lifetime.
	 *
	 * @param entry - The cache entry to check, which should implement the BaseCacheObject interface.
	 * @param lifetime - The lifetime duration in milliseconds. Defaults to the cacheConfig's lifetime if not provided.
	 * @returns A boolean indicating whether the cache entry has expired.
	 */
	private isCacheExpired(entry: BaseCacheObject, lifetime = this.cacheConfig.lifetime): boolean {
		return new Date().getTime() - entry.lastCacheUpdate.getTime() > lifetime;
	}

	/**
	 * Checks if the cache is enabled based on the cache configuration.
	 *
	 * @returns {boolean} True if the cache is enabled, false otherwise.
	 */
	private isEnabled(): boolean {
		return this.cacheConfig.enabled;
	}

	/**
	 * Fetches the latest version of the StudioCMS package from the NPM registry.
	 *
	 * @returns {Promise<string>} A promise that resolves to the latest version string of the StudioCMS package.
	 * @throws {StudioCMSCacheError} If there is an error fetching the latest version from NPM.
	 */
	private async getLatestVersionFromNPM(pkg: string, ver = 'latest'): Promise<string> {
		try {
			const npmResponse = await fetch(`https://registry.npmjs.org/${pkg}/${ver}`);
			const npmData = await npmResponse.json();
			return npmData.version as string;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching latest version from NPM');
		}
	}

	/**
	 * Generates a VersionCacheObject with the provided version and the current date as the last cache update.
	 *
	 * @param version - The version string to be included in the VersionCacheObject.
	 * @returns An object containing the provided version and the current date as the last cache update.
	 */
	private versionReturn(version: string): VersionCacheObject {
		return {
			version,
			lastCacheUpdate: new Date(),
		};
	}

	/**
	 * Generates a cache object for the given site configuration.
	 *
	 * @param siteConfig - The site configuration to be cached.
	 * @returns An object containing the site configuration data and the timestamp of the cache update.
	 */
	private siteConfigReturn(siteConfig: SiteConfig): SiteConfigCacheObject {
		return {
			data: siteConfig,
			lastCacheUpdate: new Date(),
		};
	}

	/**
	 * Returns a PageDataCacheObject containing the provided CombinedPageData and the current date as the last cache update.
	 *
	 * @param data - The combined page data to be cached.
	 * @returns An object containing the provided data and the current date as the last cache update.
	 */
	private pageDataReturn(data: CombinedPageData): PageDataCacheObject {
		return {
			data,
			lastCacheUpdate: new Date(),
		};
	}

	/**
	 * Returns a FolderTreeCacheObject containing the provided folder tree data and the current date as the last cache update.
	 *
	 * @param data - The folder tree data to be cached.
	 * @returns An object containing the provided data and the current date as the last cache update.
	 */
	private folderTreeReturn(data: FolderNode[]): FolderTreeCacheObject {
		return {
			data,
			lastCacheUpdate: new Date(),
		};
	}

	// Folder Tree Utils

	/**
	 * Retrieves the folder tree from the cache or the database.
	 *
	 * @returns {Promise<FolderTreeCacheObject>} A promise that resolves to the folder tree.
	 * @throws {StudioCMSCacheError} If the folder tree is not found in the database or if there is an error fetching the folder tree.
	 */
	public async getFolderTree(): Promise<FolderTreeCacheObject> {
		try {
			if (!this.isEnabled()) {
				const folderTree = await this.sdk.buildFolderTree();

				if (!folderTree) {
					throw new StudioCMSCacheError('Folder tree not found in database');
				}

				return this.folderTreeReturn(folderTree);
			}

			const tree = this.folderTree.get(this.FolderTreeMapID);

			if (!tree || this.isCacheExpired(tree)) {
				const folderTree = await this.sdk.buildFolderTree();

				if (!folderTree) {
					throw new StudioCMSCacheError('Folder tree not found in database');
				}

				this.folderTree.set(this.FolderTreeMapID, this.folderTreeReturn(folderTree));

				return this.folderTreeReturn(folderTree);
			}

			return tree;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching folder tree');
		}
	}

	/**
	 * Retrieves the folder tree from the cache or the database.
	 *
	 * @returns {Promise<FolderTreeCacheObject>} A promise that resolves to the folder tree.
	 * @throws {StudioCMSCacheError} If the folder tree is not found in the database or if there is an error fetching the folder tree.
	 */
	public async getPageFolderTree(): Promise<FolderTreeCacheObject> {
		try {
			if (!this.isEnabled()) {
				const folderTree = await this.sdk.buildFolderTree();
				const pages = await this.sdk.GET.database.pages();

				if (!folderTree) {
					throw new StudioCMSCacheError('Folder tree not found in database');
				}

				for (const page of pages) {
					if (page.parentFolder) {
						this.sdk.addPageToFolderTree(folderTree, page.parentFolder, {
							id: page.id,
							name: page.title,
							page: true,
							children: [],
						});
					}

					folderTree.push({
						id: page.id,
						name: page.title,
						page: true,
						children: [],
					});
				}

				return this.folderTreeReturn(folderTree);
			}

			const tree = this.pageFolderTree.get(this.PageFolderTreeMapID);

			if (!tree || this.isCacheExpired(tree)) {
				const folderTree = await this.sdk.buildFolderTree();
				const pages = await this.sdk.GET.database.pages();

				if (!folderTree) {
					throw new StudioCMSCacheError('Folder tree could not be constructed from database');
				}

				for (const page of pages) {
					if (page.parentFolder) {
						this.sdk.addPageToFolderTree(folderTree, page.parentFolder, {
							id: page.id,
							name: page.title,
							page: true,
							children: [],
						});
					}

					folderTree.push({
						id: page.id,
						name: page.title,
						page: true,
						children: [],
					});
				}

				this.folderTree.set(this.PageFolderTreeMapID, this.folderTreeReturn(folderTree));

				return this.folderTreeReturn(folderTree);
			}

			return tree;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching folder tree');
		}
	}

	/**
	 * Updates the folder tree in the cache and database.
	 *
	 * @returns {Promise<FolderTreeCacheObject>} A promise that resolves to the updated folder tree.
	 * @throws {StudioCMSCacheError} If there is an error updating the folder tree.
	 */
	public async updateFolderTree(): Promise<FolderTreeCacheObject> {
		try {
			const folderTree = await this.sdk.buildFolderTree();

			if (!this.isEnabled()) {
				return this.folderTreeReturn(folderTree);
			}

			this.folderTree.set(this.FolderTreeMapID, this.folderTreeReturn(folderTree));

			return this.folderTreeReturn(folderTree);
		} catch (error) {
			throw new StudioCMSCacheError('Error updating folder tree');
		}
	}

	/**
	 * Clears the folder tree from the cache.
	 */
	public clearFolderTree(): void {
		// Check if caching is disabled
		if (!this.isEnabled()) {
			return;
		}

		// Clear the folder tree cache
		this.folderTree.clear();

		// Return void
		return;
	}

	// Version Utils

	/**
	 * Retrieves the version information from the cache or fetches the latest version from NPM if the cache is disabled or expired.
	 *
	 * @returns {Promise<VersionCacheObject>} A promise that resolves to the version information object.
	 */
	public async getVersion(): Promise<VersionCacheObject> {
		try {
			if (!this.isEnabled()) {
				const version = await this.getLatestVersionFromNPM(this.StudioCMSPkgId);

				return this.versionReturn(version);
			}

			const latestVersion = this.version.get(this.VersionMapID);

			if (!latestVersion || this.isCacheExpired(latestVersion, this.versionCacheLifetime)) {
				const version = await this.getLatestVersionFromNPM(this.StudioCMSPkgId);

				const latestVersion = this.versionReturn(version);

				this.version.set(this.VersionMapID, latestVersion);

				return latestVersion;
			}

			return latestVersion;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching version information');
		}
	}

	/**
	 * Updates the version cache with the latest version from NPM.
	 *
	 * @returns {Promise<VersionCacheObject>} A promise that resolves to the new version cache object.
	 *
	 * @throws {Error} If there is an issue retrieving the latest version from NPM.
	 */
	public async updateVersion(): Promise<VersionCacheObject> {
		try {
			const latestVersion = await this.getLatestVersionFromNPM(this.StudioCMSPkgId);

			const newVersion = this.versionReturn(latestVersion);

			if (!this.isEnabled()) {
				return newVersion;
			}

			this.version.set(this.VersionMapID, newVersion);

			return newVersion;
		} catch (error) {
			throw new StudioCMSCacheError('Error updating version information');
		}
	}

	/**
	 * Clears the current version from the cache.
	 *
	 * This method removes all entries associated with the current version
	 * from the cache, effectively resetting it.
	 */
	public clearVersion(): void {
		// Check if caching is disabled
		if (!this.isEnabled()) {
			return;
		}

		// Clear the version cache
		this.version.clear();

		// Return void
		return;
	}

	// Site Config Utils

	/**
	 * Retrieves the site configuration from the cache or database.
	 *
	 * If caching is disabled, it fetches the site configuration directly from the database.
	 * If caching is enabled, it first checks the cache for the site configuration. If the cache is expired or not found,
	 * it fetches the site configuration from the database, updates the cache, and returns the configuration.
	 *
	 * @returns {Promise<SiteConfigCacheObject>} A promise that resolves to the site configuration object.
	 * @throws {StudioCMSCacheError} If the site configuration is not found in the database.
	 */
	public async getSiteConfig(): Promise<SiteConfigCacheObject> {
		try {
			if (!this.isEnabled()) {
				const newSiteConfig = await this.sdk.GET.database.config();

				if (!newSiteConfig) {
					throw new StudioCMSCacheError('Site config not found in database');
				}

				return this.siteConfigReturn(newSiteConfig);
			}

			const siteConfig = this.siteConfig.get(this.SiteConfigMapID);

			if (!siteConfig || this.isCacheExpired(siteConfig)) {
				const newSiteConfig = await this.sdk.GET.database.config();

				if (!newSiteConfig) {
					throw new StudioCMSCacheError('Site config not found in database');
				}

				const returnConfig: SiteConfigCacheObject = this.siteConfigReturn(newSiteConfig);

				this.siteConfig.set(this.SiteConfigMapID, returnConfig);

				return returnConfig;
			}

			return siteConfig;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching site configuration');
		}
	}

	/**
	 * Updates the site configuration in the database and cache.
	 *
	 * @param data - The new site configuration data to be updated.
	 * @returns A promise that resolves to the updated site configuration cache object.
	 * @throws {StudioCMSCacheError} If the updated data could not be retrieved from the database.
	 */
	public async updateSiteConfig(data: SiteConfig): Promise<SiteConfigCacheObject> {
		try {
			// Update the site config in the database
			const newSiteConfig = await this.sdk.UPDATE.siteConfig({ ...data, id: this.CMSSiteConfigId });

			// Check if the data was returned successfully
			if (!newSiteConfig) {
				throw new StudioCMSCacheError('Could not retrieve updated data from the database.');
			}

			const returnConfig: SiteConfigCacheObject = this.siteConfigReturn(newSiteConfig);

			// Check if caching is disabled
			if (!this.isEnabled()) {
				// Transform and return the data
				return returnConfig;
			}

			// Update the cache
			this.siteConfig.set(this.SiteConfigMapID, returnConfig);

			// Return the data
			return returnConfig;
		} catch (error) {
			throw new StudioCMSCacheError('Error updating site configuration');
		}
	}

	// Page Utils

	/**
	 * Clear a page from the cache by its ID
	 * @param id - The ID of the page
	 *
	 * @returns void
	 */
	public clearPageById(id: string): void {
		// Check if caching is disabled
		if (!this.isEnabled()) {
			return;
		}

		// Delete the page from the cache
		this.pages.delete(id);

		// Return void
		return;
	}

	/**
	 * Clear a page from the cache by its slug and package
	 * @param slug - The slug of the page
	 * @param pkg - The package of the page
	 *
	 * @returns void
	 */
	public clearPageBySlug(slug: string, pkg: string): void {
		// Check if caching is disabled
		if (!this.isEnabled()) {
			return;
		}

		// Find the keys of the pages that match the slug and package
		const keyIndex: string[] = [];

		// Iterate through the pages
		for (const [key, cachedObject] of this.pages) {
			if (cachedObject.data.slug === slug && cachedObject.data.package === pkg) {
				keyIndex.push(key);
			}
		}

		// Iterate through the key index and delete the pages
		for (const key of keyIndex) {
			this.pages.delete(key);
		}

		// Return void
		return;
	}

	/**
	 * Clear all pages from the cache
	 *
	 * @returns void
	 */
	public clearAllPages(): void {
		// Check if caching is disabled
		if (!this.isEnabled()) {
			return;
		}

		// Clear all pages from the cache
		this.pages.clear();

		// Return void
		return;
	}

	/**
	 * Retrieves all pages from the cache or the database.
	 *
	 * @returns {Promise<PageDataCacheObject[]>} A promise that resolves to an array of page data cache objects.
	 *
	 * @throws {StudioCMS_SDK_Error} If the cache is empty and could not be updated, or if the cache is expired and could not be updated.
	 *
	 * @remarks
	 * - If caching is disabled, the data is retrieved directly from the database.
	 * - If the cache is empty, the data is retrieved from the database and stored in the cache.
	 * - If the cache contains data, it checks for expired entries and updates them from the database if necessary.
	 */
	public async getAllPages(): Promise<PageDataCacheObject[]> {
		try {
			// Check if caching is disabled
			if (!this.isEnabled()) {
				const pages = await this.sdk.GET.database.pages();
				return pages.map((page) => this.pageDataReturn(page));
			}

			const { data: tree } = await this.getFolderTree();

			// Check if the cache is empty
			if (this.pages.size === 0) {
				// Retrieve the data from the database
				const updatedData = await this.sdk.GET.database.pages(tree);

				// Check if the data was retrieved successfully
				if (!updatedData) {
					throw new StudioCMSCacheError('Cache is empty and could not be updated.');
				}

				// Loop through the updated data and store it in the cache
				for (const data of updatedData) {
					this.pages.set(data.id, this.pageDataReturn(data));
				}

				// Transform and return the data
				return updatedData.map((data) => this.pageDataReturn(data));
			}

			// Create a map of the cache
			const cacheMap = Array.from(this.pages.values());

			// Loop through the cache and update the expired entries
			for (const object of cacheMap) {
				// Check if the cache is expired
				if (this.isCacheExpired(object)) {
					const updatedData = await this.sdk.GET.databaseEntry.pages.byId(object.data.id, tree);

					if (!updatedData) {
						throw new StudioCMSCacheError('Cache is expired and could not be updated.');
					}

					this.pages.set(updatedData.id, this.pageDataReturn(updatedData));
				}
			}

			// Transform and return the data
			return Array.from(this.pages.values());
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching all pages');
		}
	}

	/**
	 * Retrieves a page by its ID, either from the cache or the database.
	 *
	 * @param {string} id - The ID of the page to retrieve.
	 * @returns {Promise<PageDataCacheObject>} - A promise that resolves to the page data.
	 * @throws {StudioCMSCacheError} - Throws an error if the page is not found in the database or if there is an error fetching the page.
	 */
	public async getPageById(id: string): Promise<PageDataCacheObject> {
		try {
			// Check if caching is disabled
			if (!this.isEnabled()) {
				const page = await this.sdk.GET.databaseEntry.pages.byId(id);

				if (!page) {
					throw new StudioCMSCacheError('Page not found in database');
				}

				return this.pageDataReturn(page);
			}

			const { data: tree } = await this.getFolderTree();

			// Retrieve the cached page
			const cachedPage = this.pages.get(id);

			// Check if the page is not cached or the cache is expired
			if (!cachedPage || this.isCacheExpired(cachedPage)) {
				const page = await this.sdk.GET.databaseEntry.pages.byId(id, tree);

				if (!page) {
					throw new StudioCMSCacheError('Page not found in database');
				}

				const returnPage = this.pageDataReturn(page);

				this.pages.set(id, returnPage);

				return returnPage;
			}

			// Return the cached page
			return cachedPage;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching page by ID');
		}
	}

	/**
	 * Retrieves a page by its slug from the cache or database.
	 *
	 * @param {string} slug - The slug of the page to retrieve.
	 * @param {string} pkg - The package name associated with the page.
	 * @returns {Promise<PageDataCacheObject>} A promise that resolves to the page data.
	 * @throws {StudioCMSCacheError} If the page is not found in the database or if there is an error fetching the page.
	 */
	public async getPageBySlug(slug: string, pkg: string): Promise<PageDataCacheObject> {
		try {
			// Check if caching is disabled
			if (!this.isEnabled()) {
				const page = await this.sdk.GET.databaseEntry.pages.bySlug(slug, pkg);

				if (!page) {
					throw new StudioCMSCacheError('Page not found in database');
				}

				return this.pageDataReturn(page);
			}

			const { data: tree } = await this.getFolderTree();

			// Retrieve the cached page
			const cachedPage = Array.from(this.pages.values()).find(
				(page) => page.data.slug === slug && page.data.package === pkg
			);

			// Check if the page is not cached or the cache is expired
			if (!cachedPage || this.isCacheExpired(cachedPage)) {
				const page = await this.sdk.GET.databaseEntry.pages.bySlug(slug, pkg, tree);

				if (!page) {
					throw new StudioCMSCacheError('Page not found in database');
				}

				const returnPage = this.pageDataReturn(page);

				this.pages.set(page.id, returnPage);

				return returnPage;
			}

			// Return the cached page
			return cachedPage;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching page by slug');
		}
	}

	/**
	 * Updates a page by its ID with the provided data.
	 *
	 * @param id - The ID of the page to update.
	 * @param data - An object containing the page data and page content to update.
	 * @param data.pageData - The data of the page to update.
	 * @param data.pageContent - The content of the page to update.
	 * @returns A promise that resolves to the updated page data cache object.
	 * @throws {StudioCMSCacheError} If the page is not found in the database or if there is an error updating the page.
	 */
	public async updatePageById(
		id: string,
		data: {
			pageData: tsPageDataSelect;
			pageContent: tsPageContentSelect;
		}
	): Promise<PageDataCacheObject> {
		try {
			// Check if caching is disabled
			if (!this.isEnabled()) {
				await this.sdk.UPDATE.page(data.pageData);
				await this.sdk.UPDATE.pageContent(data.pageContent);

				const updatedData = await this.sdk.GET.databaseEntry.pages.byId(id);

				if (!updatedData) {
					throw new StudioCMSCacheError('Page not found in database');
				}

				return this.pageDataReturn(updatedData);
			}

			const { data: tree } = await this.updateFolderTree();

			// Update the page in the database
			await this.sdk.UPDATE.page(data.pageData);
			await this.sdk.UPDATE.pageContent(data.pageContent);

			// Retrieve the updated data
			const updatedData = await this.sdk.GET.databaseEntry.pages.byId(id, tree);

			if (!updatedData) {
				throw new StudioCMSCacheError('Page not found in database');
			}

			// Update the cache
			const returnData = this.pageDataReturn(updatedData);

			this.pages.set(id, returnData);

			return returnData;
		} catch (error) {
			throw new StudioCMSCacheError('Error updating page by ID');
		}
	}

	/**
	 * Updates a page by its slug and package name.
	 *
	 * @param slug - The slug of the page to update.
	 * @param pkg - The package name of the page to update.
	 * @param data - An object containing the page data and page content to update.
	 * @param data.pageData - The data of the page to update.
	 * @param data.pageContent - The content of the page to update.
	 * @returns A promise that resolves to the updated page data cache object.
	 * @throws {StudioCMSCacheError} If the page is not found in the cache or database, or if there is an error updating the page.
	 */
	public async updatePageBySlug(
		slug: string,
		pkg: string,
		data: {
			pageData: tsPageDataSelect;
			pageContent: tsPageContentSelect;
		}
	): Promise<PageDataCacheObject> {
		try {
			// Check if caching is disabled
			if (!this.isEnabled()) {
				await this.sdk.UPDATE.page(data.pageData);
				await this.sdk.UPDATE.pageContent(data.pageContent);

				const updatedData = await this.sdk.GET.databaseEntry.pages.bySlug(slug, pkg);

				if (!updatedData) {
					throw new StudioCMSCacheError('Page not found in database');
				}

				return this.pageDataReturn(updatedData);
			}

			const { data: tree } = await this.updateFolderTree();

			// Retrieve the cached page
			const cachedPage = Array.from(this.pages.values()).find(
				(page) => page.data.slug === slug && page.data.package === pkg
			);

			// Check if the page is not cached
			if (!cachedPage) {
				throw new StudioCMSCacheError('Page not found in cache');
			}

			// Update the page in the database
			await this.sdk.UPDATE.page(data.pageData);
			await this.sdk.UPDATE.pageContent(data.pageContent);

			// Retrieve the updated data
			const updatedData = await this.sdk.GET.databaseEntry.pages.bySlug(slug, pkg, tree);

			// Check if the data was returned successfully
			if (!updatedData) {
				throw new StudioCMSCacheError('Page not found in database');
			}

			// Update the cache
			const returnData = this.pageDataReturn(updatedData);
			this.pages.set(updatedData.id, returnData);

			// Return the data
			return returnData;
		} catch (error) {
			throw new StudioCMSCacheError('Error updating page by slug');
		}
	}

	/**
	 * Returns an object containing methods to interact with the cache.
	 */
	public cacheModule = {
		GET: {
			page: {
				byId: async (id: string) => await this.getPageById(id),
				bySlug: async (slug: string, pkg: string) => await this.getPageBySlug(slug, pkg),
			},
			pages: async () => await this.getAllPages(),
			siteConfig: async () => await this.getSiteConfig(),
			latestVersion: async () => await this.getVersion(),
			folderTree: async () => await this.getFolderTree(),
			pageFolderTree: async () => await this.getPageFolderTree(),
		},
		CLEAR: {
			page: {
				byId: (id: string) => this.clearPageById(id),
				bySlug: (slug: string, pkg: string) => this.clearPageBySlug(slug, pkg),
			},
			pages: () => this.clearAllPages(),
			latestVersion: () => this.clearVersion(),
			folderTree: () => this.clearFolderTree(),
		},
		UPDATE: {
			page: {
				byId: async (
					id: string,
					data: { pageData: tsPageDataSelect; pageContent: tsPageContentSelect }
				) => await this.updatePageById(id, data),
				bySlug: async (
					slug: string,
					pkg: string,
					data: { pageData: tsPageDataSelect; pageContent: tsPageContentSelect }
				) => await this.updatePageBySlug(slug, pkg, data),
			},
			siteConfig: async (data: SiteConfig) => await this.updateSiteConfig(data),
			latestVersion: async () => await this.updateVersion(),
			folderTree: async () => await this.updateFolderTree(),
		},
	};
}

export default StudioCMSVirtualCache;
