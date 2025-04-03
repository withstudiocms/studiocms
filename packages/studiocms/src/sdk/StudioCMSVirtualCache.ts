import type { Database } from '@astrojs/db/runtime';
import { CMSSiteConfigId, versionCacheLifetime } from '../consts.js';
import type { studiocmsSDKCore } from './core.js';
import { StudioCMSCacheError } from './errors.js';
import type {
	BaseCacheObject,
	CombinedInsertContent,
	CombinedPageData,
	FolderListCacheObject,
	FolderListItem,
	FolderNode,
	FolderTreeCacheObject,
	MetaOnlyPageDataCacheObject,
	PageDataCacheObject,
	PageDataCacheReturnType,
	ProcessedCacheConfig,
	SiteConfig,
	SiteConfigCacheObject,
	VersionCacheObject,
	tsPageContentSelect,
	tsPageDataInsert,
	tsPageDataSelect,
	tsPageFolderInsert,
	tsPageFolderSelect,
} from './types/index.js';

type StudioCMSSDK = ReturnType<typeof studiocmsSDKCore>;

function convertCombinedPageDataToMetaOnly<T extends PageDataCacheObject[] | PageDataCacheObject>(
	data: T
): PageDataCacheReturnType<T> {
	console.log('Converting');
	try {
		if (Array.isArray(data)) {
			return data.map(
				({ lastCacheUpdate, data: { defaultContent, multiLangContent, ...data } }) => ({
					lastCacheUpdate,
					data,
				})
			) as PageDataCacheReturnType<T>;
		}
		const {
			lastCacheUpdate,
			data: { defaultContent, multiLangContent, ...metaOnlyData },
		} = data;
		return {
			lastCacheUpdate,
			data: metaOnlyData,
		} as PageDataCacheReturnType<T>;
	} catch (error) {
		throw new StudioCMSCacheError('Error Converting metadata');
	}
}

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
 * @param {StudioCMSSDK} sdkCore - The StudioCMS SDK instance.
 */
export class StudioCMSVirtualCache {
	private readonly SiteConfigMapID: string = '__StudioCMS_Site_Config';
	private readonly VersionMapID: string = '__StudioCMS_Latest_Version';
	private readonly FolderTreeMapID: string = '__StudioCMS_Folder_Tree';
	private readonly PageFolderTreeMapID: string = '__StudioCMS_Page_Folder_Tree';
	private readonly FolderListMapID: string = '__StudioCMS_Folder_List';
	private readonly StudioCMSPkgId: string = 'studiocms';
	private readonly CMSSiteConfigId = CMSSiteConfigId;
	private readonly versionCacheLifetime = versionCacheLifetime;

	private readonly cacheConfig: ProcessedCacheConfig;
	private readonly sdk: StudioCMSSDK;

	private pages = new Map<string, PageDataCacheObject>();
	private siteConfig = new Map<string, SiteConfigCacheObject>();
	private version = new Map<string, VersionCacheObject>();
	private folderTree = new Map<string, FolderTreeCacheObject>();
	private pageFolderTree = new Map<string, FolderTreeCacheObject>();
	private FolderList = new Map<string, FolderListCacheObject>();

	public cacheModule: {
		GET: {
			page: {
				byId: {
					(id: string): Promise<PageDataCacheObject>;
					(id: string, metaOnly?: boolean): Promise<MetaOnlyPageDataCacheObject>;
				};
				bySlug: {
					(slug: string): Promise<PageDataCacheObject>;
					(slug: string, metaOnly?: boolean): Promise<MetaOnlyPageDataCacheObject>;
				};
			};
			pages: {
				(includeDrafts?: boolean, hideDefaultIndex?: boolean): Promise<PageDataCacheObject[]>;
				(
					includeDrafts?: boolean,
					hideDefaultIndex?: boolean,
					metaOnly?: boolean
				): Promise<MetaOnlyPageDataCacheObject[]>;
			};
			folderPages: {
				(
					id: string,
					includeDrafts?: boolean,
					hideDefaultIndex?: boolean
				): Promise<PageDataCacheObject[]>;
				(
					id: string,
					includeDrafts?: boolean,
					hideDefaultIndex?: boolean,
					metaOnly?: boolean
				): Promise<MetaOnlyPageDataCacheObject[]>;
			};
			siteConfig: () => Promise<SiteConfigCacheObject>;
			latestVersion: () => Promise<VersionCacheObject>;
			folderTree: () => Promise<FolderTreeCacheObject>;
			pageFolderTree: (
				includeDrafts?: boolean,
				hideDefaultIndex?: boolean
			) => Promise<FolderTreeCacheObject>;
			folderList: () => Promise<FolderListCacheObject>;
			folder: (
				id: string
			) => Promise<{ name: string; id: string; parent: string | null } | undefined>;
			databaseTable: StudioCMSSDK['GET']['databaseTable'];
		};
		POST: {
			page: (data: {
				pageData: tsPageDataInsert;
				pageContent: CombinedInsertContent;
			}) => Promise<PageDataCacheObject>;
			folder: (
				data: tsPageFolderInsert
			) => Promise<{ name: string; id: string; parent: string | null } | undefined>;
		};
		CLEAR: {
			page: {
				byId: (id: string) => void;
				bySlug: (slug: string) => void;
			};
			pages: () => void;
			latestVersion: () => void;
			folderTree: () => void;
			folderList: () => void;
		};
		UPDATE: {
			page: {
				byId: (
					id: string,
					data: { pageData: tsPageDataSelect; pageContent: tsPageContentSelect }
				) => Promise<PageDataCacheObject>;
				bySlug: (
					slug: string,
					data: { pageData: tsPageDataSelect; pageContent: tsPageContentSelect }
				) => Promise<PageDataCacheObject>;
			};
			siteConfig: (data: SiteConfig) => Promise<SiteConfigCacheObject>;
			latestVersion: () => Promise<VersionCacheObject>;
			folderTree: () => Promise<FolderTreeCacheObject>;
			folderList: () => Promise<FolderListCacheObject>;
			folder: (
				data: tsPageFolderSelect
			) => Promise<{ name: string; id: string; parent: string | null }>;
		};
		DELETE: {
			page: (id: string) => Promise<void>;
			folder: (id: string) => Promise<void>;
		};
		db: Database;
		diffTracking: StudioCMSSDK['diffTracking'];
	};

	constructor(cacheConfig: ProcessedCacheConfig, sdkCore: StudioCMSSDK) {
		this.cacheConfig = cacheConfig;
		this.sdk = sdkCore;
		this.cacheModule = {
			GET: {
				page: {
					byId: this.getPageById,
					bySlug: this.getPageBySlug,
				},
				pages: this.getAllPages,
				folderPages: this.folderPages,
				siteConfig: this.getSiteConfig,
				latestVersion: this.getVersion,
				folderTree: this.getFolderTree,
				pageFolderTree: this.getPageFolderTree,
				folderList: this.getFolderList,
				folder: async (id: string) => await this.sdk.GET.databaseEntry.folder(id),
				databaseTable: sdkCore.GET.databaseTable,
			},
			POST: {
				page: this.createPage,
				folder: async (data: tsPageFolderInsert) => {
					const newEntry = await this.sdk.POST.databaseEntry.folder(data);
					this.clearFolderTree();
					await this.updateFolderTree();
					await this.updateFolderList();
					return newEntry;
				},
			},
			CLEAR: {
				page: {
					byId: this.clearPageById,
					bySlug: this.clearPageBySlug,
				},
				pages: this.clearAllPages,
				latestVersion: this.clearVersion,
				folderTree: this.clearFolderTree,
				folderList: this.clearFolderList,
			},
			UPDATE: {
				page: {
					byId: this.updatePageById,
					bySlug: this.updatePageBySlug,
				},
				siteConfig: this.updateSiteConfig,
				latestVersion: this.updateVersion,
				folderTree: this.updateFolderTree,
				folderList: this.updateFolderList,
				folder: async (data: tsPageFolderSelect) => {
					const updatedEntry = await this.sdk.UPDATE.folder(data);
					this.clearFolderTree();
					await this.updateFolderTree();
					await this.updateFolderList();
					return updatedEntry;
				},
			},
			DELETE: {
				page: async (id: string) => {
					await this.sdk.DELETE.page(id);
					this.clearAllPages();
				},
				folder: async (id: string) => {
					await this.sdk.DELETE.folder(id);
					this.clearFolderTree();
					await this.updateFolderTree();
					await this.updateFolderList();
				},
			},
			db: sdkCore.db,
			diffTracking: sdkCore.diffTracking,
		};
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

	private folderListReturn(data: FolderListItem[]): FolderListCacheObject {
		return {
			data,
			lastCacheUpdate: new Date(),
		};
	}

	// Folder Tree Utils

	public async getFolderList(): Promise<FolderListCacheObject> {
		try {
			if (!this.isEnabled()) {
				const folderList = await this.sdk.getAvailableFolders();

				if (!folderList) {
					throw new StudioCMSCacheError('Folder list not found in database');
				}

				return this.folderListReturn(folderList);
			}

			const list = this.FolderList.get(this.FolderListMapID);

			if (!list || this.isCacheExpired(list)) {
				const folderList = await this.sdk.getAvailableFolders();

				if (!folderList) {
					throw new StudioCMSCacheError('Folder list not found in database');
				}

				this.FolderList.set(this.FolderListMapID, this.folderListReturn(folderList));

				return this.folderListReturn(folderList);
			}

			return list;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching folder list');
		}
	}

	public async updateFolderList(): Promise<FolderListCacheObject> {
		try {
			const folderList = await this.sdk.getAvailableFolders();

			if (!this.isEnabled()) {
				return this.folderListReturn(folderList);
			}

			this.FolderList.set(this.FolderListMapID, this.folderListReturn(folderList));

			return this.folderListReturn(folderList);
		} catch (error) {
			throw new StudioCMSCacheError('Error updating folder list');
		}
	}

	public clearFolderList(): void {
		// Check if caching is disabled
		if (!this.isEnabled()) {
			return;
		}

		// Clear the folder list cache
		this.FolderList.clear();

		// Return void
		return;
	}

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
	public async getPageFolderTree(
		includeDrafts = false,
		hideDefaultIndex = false
	): Promise<FolderTreeCacheObject> {
		try {
			if (!this.isEnabled()) {
				const folderTree = await this.sdk.buildFolderTree();
				const pages = await this.sdk.GET.database.pages(includeDrafts, hideDefaultIndex);

				if (!folderTree) {
					throw new StudioCMSCacheError('Folder tree not found in database');
				}

				for (const page of pages) {
					if (!includeDrafts && page.draft) {
						continue;
					}

					if (page.parentFolder) {
						this.sdk.addPageToFolderTree(folderTree, page.parentFolder, {
							id: page.id,
							name: page.title,
							page: true,
							pageData: page,
							children: [],
						});
					} else {
						folderTree.push({
							id: page.id,
							name: page.title,
							page: true,
							pageData: page,
							children: [],
						});
					}
				}

				return this.folderTreeReturn(folderTree);
			}

			const tree = this.pageFolderTree.get(this.PageFolderTreeMapID);

			if (!tree || this.isCacheExpired(tree)) {
				const folderTree = await this.sdk.buildFolderTree();
				const pages = await this.sdk.GET.database.pages(includeDrafts, hideDefaultIndex);

				if (!folderTree) {
					throw new StudioCMSCacheError('Folder tree could not be constructed from database');
				}

				for (const page of pages) {
					if (!includeDrafts && page.draft) {
						continue;
					}

					if (page.parentFolder) {
						this.sdk.addPageToFolderTree(folderTree, page.parentFolder, {
							id: page.id,
							name: page.title,
							page: true,
							pageData: page,
							children: [],
						});
					} else {
						folderTree.push({
							id: page.id,
							name: page.title,
							page: true,
							pageData: page,
							children: [],
						});
					}
				}

				this.folderTree.set(this.PageFolderTreeMapID, this.folderTreeReturn(folderTree));
				this.clearFolderTree();

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
			throw new StudioCMSCacheError('Error fetching site configuration', (error as Error).stack);
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

			this.siteConfig.clear();

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
	public clearPageBySlug(slug: string): void {
		// Check if caching is disabled
		if (!this.isEnabled()) {
			return;
		}

		// Find the keys of the pages that match the slug and package
		const keyIndex: string[] = [];

		// Iterate through the pages
		for (const [key, cachedObject] of this.pages) {
			if (cachedObject.data.slug === slug) {
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
		this.clearFolderTree();
		this.clearFolderList();

		// Return void
		return;
	}

	public async folderPages(
		id: string,
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean
	): Promise<PageDataCacheObject[]>;
	public async folderPages(
		id: string,
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		metaOnly?: boolean
	): Promise<MetaOnlyPageDataCacheObject[]>;

	public async folderPages(
		id: string,
		includeDrafts = false,
		hideDefaultIndex = false,
		metaOnly = false
	) {
		try {
			// Check if caching is disabled
			if (!this.isEnabled()) {
				const pages = await this.sdk.GET.database.folderPages(id, includeDrafts, hideDefaultIndex);
				const data = pages.map((page) => this.pageDataReturn(page));
				return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
			}

			const { data: tree } = await this.getFolderTree();

			// Check if the cache is empty
			if (this.pages.size === 0) {
				// Retrieve the data from the database
				const updatedData = await this.sdk.GET.database.pages(
					includeDrafts,
					hideDefaultIndex,
					tree
				);

				// Check if the data was retrieved successfully
				if (!updatedData) {
					throw new StudioCMSCacheError('Cache is empty and could not be updated.');
				}

				// Loop through the updated data and store it in the cache
				for (const data of updatedData) {
					this.pages.set(data.id, this.pageDataReturn(data));
				}

				const data = updatedData
					.filter(({ parentFolder }) => parentFolder === id)
					.map((data) => this.pageDataReturn(data));

				// Transform and return the data
				return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
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
			const data = Array.from(this.pages.values()).filter(
				({ data: { parentFolder } }) => parentFolder === id
			);
			return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching all pages');
		}
	}

	public async getAllPages(
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean
	): Promise<PageDataCacheObject[]>;
	public async getAllPages(
		includeDrafts?: boolean,
		hideDefaultIndex?: boolean,
		metaOnly?: boolean
	): Promise<MetaOnlyPageDataCacheObject[]>;

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
	public async getAllPages(includeDrafts = false, hideDefaultIndex = false, metaOnly = false) {
		console.error('working 0');
		try {
			// Check if caching is disabled
			if (!this.isEnabled()) {
				const pages = await this.sdk.GET.database.pages(includeDrafts);
				const data = pages.map((page) => this.pageDataReturn(page));
				return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
			}
			console.error('working 1');

			const { data: tree } = await this.getFolderTree();

			console.error('working 2');

			// Check if the cache is empty
			if (this.pages.size === 0) {
				// Retrieve the data from the database
				const updatedData = await this.sdk.GET.database.pages(
					includeDrafts,
					hideDefaultIndex,
					tree
				);

				// Check if the data was retrieved successfully
				if (!updatedData) {
					throw new StudioCMSCacheError('Cache is empty and could not be updated.');
				}

				// Loop through the updated data and store it in the cache
				for (const data of updatedData) {
					this.pages.set(data.id, this.pageDataReturn(data));
				}

				const data = updatedData.map((data) => this.pageDataReturn(data));

				// Transform and return the data
				return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
			}

			console.error('working 3');

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

			console.error('working 4');

			// Transform and return the data
			const data = Array.from(this.pages.values());
			return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
		} catch (error) {
			throw new StudioCMSCacheError(`Error fetching all pages: ${error}`);
		}
	}

	public async getPageById(id: string): Promise<PageDataCacheObject>;
	public async getPageById(id: string, metaOnly?: boolean): Promise<MetaOnlyPageDataCacheObject>;

	/**
	 * Retrieves a page by its ID, either from the cache or the database.
	 *
	 * @param {string} id - The ID of the page to retrieve.
	 */
	public async getPageById(id: string, metaOnly = false) {
		try {
			// Check if caching is disabled
			if (!this.isEnabled()) {
				const page = await this.sdk.GET.databaseEntry.pages.byId(id);

				if (!page) {
					throw new StudioCMSCacheError('Page not found in database');
				}

				const pageData = this.pageDataReturn(page);

				return metaOnly ? convertCombinedPageDataToMetaOnly(pageData) : pageData;
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

				return metaOnly ? convertCombinedPageDataToMetaOnly(returnPage) : returnPage;
			}

			// Return the cached page
			return metaOnly ? convertCombinedPageDataToMetaOnly(cachedPage) : cachedPage;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching page by ID');
		}
	}

	public async getPageBySlug(slug: string): Promise<PageDataCacheObject>;
	public async getPageBySlug(
		slug: string,
		metaOnly?: boolean
	): Promise<MetaOnlyPageDataCacheObject>;

	/**
	 * Retrieves a page by its slug, either from the cache or the database.
	 *
	 * @param slug - The slug of the page to retrieve
	 * @param metaOnly - If true, returns only metadata without content fields
	 * @returns A promise that resolves to the page data, either full or metadata-only
	 * @throws {StudioCMSCacheError} If the page is not found in the database or cache
	 */
	public async getPageBySlug(slug: string, metaOnly = false) {
		try {
			// Check if caching is disabled
			if (!this.isEnabled()) {
				const page = await this.sdk.GET.databaseEntry.pages.bySlug(slug);

				if (!page) {
					throw new StudioCMSCacheError('Page not found in database');
				}

				const pageData = this.pageDataReturn(page);

				return metaOnly ? convertCombinedPageDataToMetaOnly(pageData) : pageData;
			}

			const { data: tree } = await this.getFolderTree();

			// Retrieve the cached page
			const cachedPage = Array.from(this.pages.values()).find((page) => page.data.slug === slug);

			// Check if the page is not cached or the cache is expired
			if (!cachedPage || this.isCacheExpired(cachedPage)) {
				const page = await this.sdk.GET.databaseEntry.pages.bySlug(slug, tree);

				if (!page) {
					throw new StudioCMSCacheError('Page not found in database');
				}

				const returnPage = this.pageDataReturn(page);

				this.pages.set(page.id, returnPage);

				return metaOnly ? convertCombinedPageDataToMetaOnly(returnPage) : returnPage;
			}

			// Return the cached page
			return metaOnly ? convertCombinedPageDataToMetaOnly(cachedPage) : cachedPage;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching page by slug');
		}
	}

	public async createPage(data: {
		pageData: tsPageDataInsert;
		pageContent: CombinedInsertContent;
	}): Promise<PageDataCacheObject> {
		try {
			if (!this.isEnabled()) {
				const newPage = await this.sdk.POST.databaseEntry.pages(data.pageData, data.pageContent);

				if (!newPage) {
					throw new StudioCMSCacheError('Error creating page');
				}

				const toReturn = await this.sdk.GET.databaseEntry.pages.byId(newPage.pageData[0].id);

				if (!toReturn) {
					throw new StudioCMSCacheError('Error creating page');
				}

				return this.pageDataReturn(toReturn);
			}

			const { data: tree } = await this.updateFolderTree();

			const newPage = await this.sdk.POST.databaseEntry.pages(data.pageData, data.pageContent);

			if (!newPage) {
				throw new StudioCMSCacheError('Error creating page');
			}

			const toReturn = await this.sdk.GET.databaseEntry.pages.byId(newPage.pageData[0].id, tree);

			if (!toReturn) {
				throw new StudioCMSCacheError('Error creating page');
			}

			this.clearAllPages();
			this.clearFolderTree();
			this.getFolderTree();

			return this.pageDataReturn(toReturn);
		} catch (error) {
			throw new StudioCMSCacheError('Error creating page');
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
			this.clearFolderTree();

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

				const updatedData = await this.sdk.GET.databaseEntry.pages.bySlug(slug);

				if (!updatedData) {
					throw new StudioCMSCacheError('Page not found in database');
				}

				return this.pageDataReturn(updatedData);
			}

			const { data: tree } = await this.updateFolderTree();

			// Retrieve the cached page
			const cachedPage = Array.from(this.pages.values()).find((page) => page.data.slug === slug);

			// Check if the page is not cached
			if (!cachedPage) {
				throw new StudioCMSCacheError('Page not found in cache');
			}

			// Update the page in the database
			await this.sdk.UPDATE.page(data.pageData);
			await this.sdk.UPDATE.pageContent(data.pageContent);

			// Retrieve the updated data
			const updatedData = await this.sdk.GET.databaseEntry.pages.bySlug(slug, tree);

			// Check if the data was returned successfully
			if (!updatedData) {
				throw new StudioCMSCacheError('Page not found in database');
			}

			// Update the cache
			const returnData = this.pageDataReturn(updatedData);
			this.pages.set(updatedData.id, returnData);
			this.clearFolderTree();

			// Return the data
			return returnData;
		} catch (error) {
			throw new StudioCMSCacheError('Error updating page by slug');
		}
	}
}

export default StudioCMSVirtualCache;
