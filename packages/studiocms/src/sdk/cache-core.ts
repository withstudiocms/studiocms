import { sdk as sdkConfig } from 'studiocms:config';
import { CMSSiteConfigId, versionCacheLifetime } from '../consts.js';
import { studiocmsSDKCore } from './core.js';
import { StudioCMSCacheError } from './errors';
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
	SiteConfig,
	SiteConfigCacheObject,
	VersionCacheObject,
	tsPageContentSelect,
	tsPageDataInsert,
	tsPageDataSelect,
	tsPageFolderInsert,
	tsPageFolderSelect,
} from './types/index.js';

const sdk = studiocmsSDKCore();
const cacheConfig = sdkConfig.cacheConfig;

const SiteConfigMapID: string = '__StudioCMS_Site_Config';
const VersionMapID: string = '__StudioCMS_Latest_Version';
const FolderTreeMapID: string = '__StudioCMS_Folder_Tree';
const PageFolderTreeMapID: string = '__StudioCMS_Page_Folder_Tree';
const FolderListMapID: string = '__StudioCMS_Folder_List';
const StudioCMSPkgId: string = 'studiocms';

type CacheMap<K, V> = ReadonlyMap<K, V> & Map<K, V>;

const pages: CacheMap<string, PageDataCacheObject> = new Map<string, PageDataCacheObject>();
const siteConfig: CacheMap<string, SiteConfigCacheObject> = new Map<
	string,
	SiteConfigCacheObject
>();
const version: CacheMap<string, VersionCacheObject> = new Map<string, VersionCacheObject>();
const folderTree: CacheMap<string, FolderTreeCacheObject> = new Map<
	string,
	FolderTreeCacheObject
>();
const pageFolderTree: CacheMap<string, FolderTreeCacheObject> = new Map<
	string,
	FolderTreeCacheObject
>();
const FolderList: CacheMap<string, FolderListCacheObject> = new Map<
	string,
	FolderListCacheObject
>();

/**
 * Checks if the cache entry has expired based on the provided lifetime.
 *
 * @param entry - The cache entry to check, which should implement the BaseCacheObject interface.
 * @param lifetime - The lifetime duration in milliseconds. Defaults to the cacheConfig's lifetime if not provided.
 * @returns A boolean indicating whether the cache entry has expired.
 */
function isCacheExpired(entry: BaseCacheObject, lifetime = cacheConfig.lifetime): boolean {
	return new Date().getTime() - entry.lastCacheUpdate.getTime() > lifetime;
}

/**
 * Checks if the cache is enabled based on the cache configuration.
 *
 * @returns {boolean} True if the cache is enabled, false otherwise.
 */
function isEnabled(): boolean {
	return cacheConfig.enabled;
}

/**
 * Fetches the latest version of the StudioCMS package from the NPM registry.
 *
 * @returns {Promise<string>} A promise that resolves to the latest version string of the StudioCMS package.
 * @throws {StudioCMSCacheError} If there is an error fetching the latest version from NPM.
 */
async function getLatestVersionFromNPM(pkg: string, ver = 'latest'): Promise<string> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 5000); // 5-second timeout

	try {
		const npmResponse = await fetch(`https://registry.npmjs.org/${pkg}/${ver}`, {
			signal: controller.signal,
		});
		clearTimeout(timeout);

		if (!npmResponse.ok) {
			throw new Error(`Failed to fetch data: ${npmResponse.statusText}`);
		}

		const npmData = await npmResponse.json();

		if (!npmData.version) {
			throw new Error('Invalid response: version field missing');
		}

		return npmData.version as string;
	} catch (error) {
		if ((error as Error).name === 'AbortError') {
			throw new StudioCMSCacheError('Request timed out while fetching latest version from NPM');
		}
		throw new StudioCMSCacheError(
			`Error fetching latest version from NPM: ${(error as Error).message}`
		);
	}
}

/**
 * Generates a VersionCacheObject with the provided version and the current date as the last cache update.
 *
 * @param version - The version string to be included in the VersionCacheObject.
 * @returns An object containing the provided version and the current date as the last cache update.
 */
function versionReturn(version: string): VersionCacheObject {
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
function siteConfigReturn(siteConfig: SiteConfig): SiteConfigCacheObject {
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
function pageDataReturn(data: CombinedPageData): PageDataCacheObject {
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
function folderTreeReturn(data: FolderNode[]): FolderTreeCacheObject {
	return {
		data,
		lastCacheUpdate: new Date(),
	};
}

function folderListReturn(data: FolderListItem[]): FolderListCacheObject {
	return {
		data,
		lastCacheUpdate: new Date(),
	};
}

function convertCombinedPageDataToMetaOnly<T extends PageDataCacheObject[] | PageDataCacheObject>(
	data: T
): PageDataCacheReturnType<T> {
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

async function getFolderList(): Promise<FolderListCacheObject> {
	try {
		if (!isEnabled()) {
			const folderList = await sdk.getAvailableFolders();

			if (!folderList) {
				throw new StudioCMSCacheError('Folder list not found in database');
			}

			return folderListReturn(folderList);
		}

		const list = FolderList.get(FolderListMapID);

		if (!list || isCacheExpired(list)) {
			const folderList = await sdk.getAvailableFolders();

			if (!folderList) {
				throw new StudioCMSCacheError('Folder list not found in database');
			}

			FolderList.set(FolderListMapID, folderListReturn(folderList));

			return folderListReturn(folderList);
		}

		return list;
	} catch (error) {
		throw new StudioCMSCacheError('Error fetching folder list');
	}
}

async function updateFolderList(): Promise<FolderListCacheObject> {
	try {
		const folderList = await sdk.getAvailableFolders();

		if (!isEnabled()) {
			return folderListReturn(folderList);
		}

		FolderList.set(FolderListMapID, folderListReturn(folderList));

		return folderListReturn(folderList);
	} catch (error) {
		throw new StudioCMSCacheError('Error updating folder list');
	}
}

function clearFolderTree(): void {
	// Check if caching is disabled
	if (!isEnabled()) {
		return;
	}

	// Clear the folder tree cache
	folderTree.clear();

	// Return void
	return;
}

function clearFolderList(): void {
	// Check if caching is disabled
	if (!isEnabled()) {
		return;
	}

	// Clear the folder list cache
	FolderList.clear();

	// Return void
	return;
}

async function getFolderTree(): Promise<FolderTreeCacheObject> {
	try {
		if (!isEnabled()) {
			const newFolderTree = await sdk.buildFolderTree();

			if (!newFolderTree) {
				throw new StudioCMSCacheError('Folder tree not found in database');
			}

			return folderTreeReturn(newFolderTree);
		}

		const tree = folderTree.get(FolderTreeMapID);

		if (!tree || isCacheExpired(tree)) {
			const newFolderTree = await sdk.buildFolderTree();

			if (!newFolderTree) {
				throw new StudioCMSCacheError('Folder tree not found in database');
			}

			folderTree.set(FolderTreeMapID, folderTreeReturn(newFolderTree));

			return folderTreeReturn(newFolderTree);
		}

		return tree;
	} catch (error) {
		throw new StudioCMSCacheError('Error fetching folder tree');
	}
}

async function updateFolderTreeWithNewPage(newPageData: CombinedPageData): Promise<void> {
	try {
		if (!isEnabled()) return;

		// Get the current folder tree
		const cachedTree = folderTree.get(FolderTreeMapID);
		if (!cachedTree) return; // No tree to update

		const tree = [...cachedTree.data]; // Create a copy to avoid direct mutation

		// Create a page node to add to the tree
		const pageNode = {
			id: newPageData.id,
			name: newPageData.title,
			page: true,
			pageData: newPageData,
			children: [],
		};

		// If page has no parent, add to root
		if (!newPageData.parentFolder) {
			tree.push(pageNode);
		} else {
			// Otherwise add to appropriate folder
			const success = sdk.addPageToFolderTree(tree, newPageData.parentFolder, pageNode);

			// If adding to folder failed (folder not found), fall back to full rebuild
			if (!success) {
				clearFolderTree();
				await getFolderTree();
				return;
			}
		}

		// Update the cache with modified tree
		folderTree.set(FolderTreeMapID, {
			data: tree,
			lastCacheUpdate: new Date(),
		});
	} catch (error) {
		// On any error, fall back to a full rebuild to ensure consistency
		clearFolderTree();
		await getFolderTree();
	}
}

async function getPageFolderTree(
	includeDrafts = false,
	hideDefaultIndex = false
): Promise<FolderTreeCacheObject> {
	try {
		if (!isEnabled()) {
			const folderTree = await sdk.buildFolderTree();
			const pages = await sdk.GET.database.pages(includeDrafts, hideDefaultIndex);

			if (!folderTree) {
				throw new StudioCMSCacheError('Folder tree not found in database');
			}

			for (const page of pages) {
				if (!includeDrafts && page.draft) {
					continue;
				}

				if (page.parentFolder) {
					sdk.addPageToFolderTree(folderTree, page.parentFolder, {
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

			return folderTreeReturn(folderTree);
		}

		const tree = pageFolderTree.get(PageFolderTreeMapID);

		if (!tree || isCacheExpired(tree)) {
			const newFolderTree = await sdk.buildFolderTree();
			const pages = await sdk.GET.database.pages(includeDrafts, hideDefaultIndex);

			if (!newFolderTree) {
				throw new StudioCMSCacheError('Folder tree could not be constructed from database');
			}

			for (const page of pages) {
				if (!includeDrafts && page.draft) {
					continue;
				}

				if (page.parentFolder) {
					sdk.addPageToFolderTree(newFolderTree, page.parentFolder, {
						id: page.id,
						name: page.title,
						page: true,
						pageData: page,
						children: [],
					});
				} else {
					newFolderTree.push({
						id: page.id,
						name: page.title,
						page: true,
						pageData: page,
						children: [],
					});
				}
			}

			folderTree.set(PageFolderTreeMapID, folderTreeReturn(newFolderTree));
			clearFolderTree();

			return folderTreeReturn(newFolderTree);
		}

		return tree;
	} catch (error) {
		throw new StudioCMSCacheError('Error fetching folder tree');
	}
}

async function updateFolderTree(): Promise<FolderTreeCacheObject> {
	try {
		const newFolderTree = await sdk.buildFolderTree();

		if (!isEnabled()) {
			return folderTreeReturn(newFolderTree);
		}

		folderTree.set(FolderTreeMapID, folderTreeReturn(newFolderTree));

		return folderTreeReturn(newFolderTree);
	} catch (error) {
		throw new StudioCMSCacheError('Error updating folder tree');
	}
}

async function getVersion(): Promise<VersionCacheObject> {
	try {
		if (!isEnabled()) {
			const version = await getLatestVersionFromNPM(StudioCMSPkgId);

			return versionReturn(version);
		}

		const latestVersion = version.get(VersionMapID);

		if (!latestVersion || isCacheExpired(latestVersion, versionCacheLifetime)) {
			const newVersion = await getLatestVersionFromNPM(StudioCMSPkgId);

			const latestVersion = versionReturn(newVersion);

			version.set(VersionMapID, latestVersion);

			return latestVersion;
		}

		return latestVersion;
	} catch (error) {
		throw new StudioCMSCacheError('Error fetching version information');
	}
}

async function updateVersion(): Promise<VersionCacheObject> {
	try {
		const latestVersion = await getLatestVersionFromNPM(StudioCMSPkgId);

		const newVersion = versionReturn(latestVersion);

		if (!isEnabled()) {
			return newVersion;
		}

		version.set(VersionMapID, newVersion);

		return newVersion;
	} catch (error) {
		throw new StudioCMSCacheError('Error updating version information');
	}
}

function clearVersion(): void {
	// Check if caching is disabled
	if (!isEnabled()) {
		return;
	}

	// Clear the version cache
	version.clear();

	// Return void
	return;
}

async function getSiteConfig(): Promise<SiteConfigCacheObject> {
	try {
		if (!isEnabled()) {
			const newSiteConfig = await sdk.GET.database.config();

			if (!newSiteConfig) {
				throw new StudioCMSCacheError('Site config not found in database');
			}

			return siteConfigReturn(newSiteConfig);
		}

		const currentSiteConfig = siteConfig.get(SiteConfigMapID);

		if (!currentSiteConfig || isCacheExpired(currentSiteConfig)) {
			const newSiteConfig = await sdk.GET.database.config();

			if (!newSiteConfig) {
				throw new StudioCMSCacheError('Site config not found in database');
			}

			const returnConfig: SiteConfigCacheObject = siteConfigReturn(newSiteConfig);

			siteConfig.set(SiteConfigMapID, returnConfig);

			return returnConfig;
		}

		return currentSiteConfig;
	} catch (error) {
		throw new StudioCMSCacheError('Error fetching site configuration', (error as Error).stack);
	}
}

async function updateSiteConfig(data: SiteConfig): Promise<SiteConfigCacheObject> {
	try {
		// Update the site config in the database
		const newSiteConfig = await sdk.UPDATE.siteConfig({ ...data, id: CMSSiteConfigId });

		// Check if the data was returned successfully
		if (!newSiteConfig) {
			throw new StudioCMSCacheError('Could not retrieve updated data from the database.');
		}

		const returnConfig: SiteConfigCacheObject = siteConfigReturn(newSiteConfig);

		// Check if caching is disabled
		if (!isEnabled()) {
			// Transform and return the data
			return returnConfig;
		}

		// Update the cache with the new configuration
		siteConfig.set(SiteConfigMapID, returnConfig);

		// Return the data
		return returnConfig;
	} catch (error) {
		throw new StudioCMSCacheError('Error updating site configuration');
	}
}

function clearPageById(id: string): void {
	// Check if caching is disabled
	if (!isEnabled()) {
		return;
	}

	// Delete the page from the cache
	pages.delete(id);

	// Return void
	return;
}

function clearPageBySlug(slug: string): void {
	// Check if caching is disabled
	if (!isEnabled()) {
		return;
	}

	// Find the keys of the pages that match the slug and package
	const keyIndex: string[] = [];

	// Iterate through the pages
	for (const [key, cachedObject] of pages) {
		if (cachedObject.data.slug === slug) {
			keyIndex.push(key);
		}
	}

	// Iterate through the key index and delete the pages
	for (const key of keyIndex) {
		pages.delete(key);
	}

	// Return void
	return;
}

function clearAllPages(): void {
	// Check if caching is disabled
	if (!isEnabled()) {
		return;
	}

	// Clear all pages from the cache
	pages.clear();
	clearFolderTree();
	clearFolderList();

	// Return void
	return;
}

async function folderPages(
	id: string,
	includeDrafts?: boolean,
	hideDefaultIndex?: boolean
): Promise<PageDataCacheObject[]>;
async function folderPages(
	id: string,
	includeDrafts?: boolean,
	hideDefaultIndex?: boolean,
	metaOnly?: boolean
): Promise<MetaOnlyPageDataCacheObject[]>;

async function folderPages(
	id: string,
	includeDrafts = false,
	hideDefaultIndex = false,
	metaOnly = false
) {
	try {
		// Check if caching is disabled
		if (!isEnabled()) {
			const dbPages = await sdk.GET.database.folderPages(id, includeDrafts, hideDefaultIndex);
			const data = dbPages.map((page) => pageDataReturn(page));
			return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
		}

		const { data: tree } = await getFolderTree();

		// Check if the cache is empty
		if (pages.size === 0) {
			// Retrieve the data from the database
			const updatedData = await sdk.GET.database.pages(includeDrafts, hideDefaultIndex, tree);

			// Check if the data was retrieved successfully
			if (!updatedData) {
				throw new StudioCMSCacheError('Cache is empty and could not be updated.');
			}

			// Loop through the updated data and store it in the cache
			for (const data of updatedData) {
				pages.set(data.id, pageDataReturn(data));
			}

			const data = updatedData
				.filter(({ parentFolder }) => parentFolder === id)
				.map((data) => pageDataReturn(data));

			// Transform and return the data
			return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
		}

		// Create a map of the cache
		const cacheMap = Array.from(pages.values());

		// Loop through the cache and update the expired entries
		for (const object of cacheMap) {
			// Check if the cache is expired
			if (isCacheExpired(object)) {
				const updatedData = await sdk.GET.databaseEntry.pages.byId(object.data.id, tree);

				if (!updatedData) {
					throw new StudioCMSCacheError('Cache is expired and could not be updated.');
				}

				pages.set(updatedData.id, pageDataReturn(updatedData));
			}
		}

		// Transform and return the data
		const data = Array.from(pages.values()).filter(
			({ data: { parentFolder } }) => parentFolder === id
		);
		return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
	} catch (error) {
		throw new StudioCMSCacheError('Error fetching all pages');
	}
}

async function getAllPages(
	includeDrafts?: boolean,
	hideDefaultIndex?: boolean
): Promise<PageDataCacheObject[]>;
async function getAllPages(
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
async function getAllPages(includeDrafts = false, hideDefaultIndex = false, metaOnly = false) {
	try {
		// Check if caching is disabled
		if (!isEnabled()) {
			const dbPages = await sdk.GET.database.pages(includeDrafts);
			const data = dbPages.map((page) => pageDataReturn(page));
			return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
		}

		const { data: tree } = await getFolderTree();

		// Check if the cache is empty
		if (pages.size === 0) {
			// Retrieve the data from the database
			const updatedData = await sdk.GET.database.pages(includeDrafts, hideDefaultIndex, tree);

			// Check if the data was retrieved successfully
			if (!updatedData) {
				throw new StudioCMSCacheError('Cache is empty and could not be updated.');
			}

			// Loop through the updated data and store it in the cache
			for (const data of updatedData) {
				pages.set(data.id, pageDataReturn(data));
			}

			const data = updatedData.map((data) => pageDataReturn(data));

			// Transform and return the data
			return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
		}

		// Create a map of the cache
		const cacheMap = Array.from(pages.values());

		// Loop through the cache and update the expired entries
		for (const object of cacheMap) {
			// Check if the cache is expired
			if (isCacheExpired(object)) {
				const updatedData = await sdk.GET.databaseEntry.pages.byId(object.data.id, tree);

				if (!updatedData) {
					throw new StudioCMSCacheError('Cache is expired and could not be updated.');
				}

				pages.set(updatedData.id, pageDataReturn(updatedData));
			}
		}

		// Transform and return the data
		const data = Array.from(pages.values());
		return metaOnly ? convertCombinedPageDataToMetaOnly(data) : data;
	} catch (error) {
		throw new StudioCMSCacheError(`Error fetching all pages: ${error}`);
	}
}

async function getPageById(id: string): Promise<PageDataCacheObject>;
async function getPageById(id: string, metaOnly?: boolean): Promise<MetaOnlyPageDataCacheObject>;

/**
 * Retrieves a page by its ID, either from the cache or the database.
 *
 * @param {string} id - The ID of the page to retrieve.
 */
async function getPageById(id: string, metaOnly = false) {
	try {
		// Check if caching is disabled
		if (!isEnabled()) {
			const page = await sdk.GET.databaseEntry.pages.byId(id);

			if (!page) {
				throw new StudioCMSCacheError('Page not found in database');
			}

			const pageData = pageDataReturn(page);

			return metaOnly ? convertCombinedPageDataToMetaOnly(pageData) : pageData;
		}

		const { data: tree } = await getFolderTree();

		// Retrieve the cached page
		const cachedPage = pages.get(id);

		// Check if the page is not cached or the cache is expired
		if (!cachedPage || isCacheExpired(cachedPage)) {
			const page = await sdk.GET.databaseEntry.pages.byId(id, tree);

			if (!page) {
				throw new StudioCMSCacheError('Page not found in database');
			}

			const returnPage = pageDataReturn(page);

			pages.set(id, returnPage);

			return metaOnly ? convertCombinedPageDataToMetaOnly(returnPage) : returnPage;
		}

		// Return the cached page
		return metaOnly ? convertCombinedPageDataToMetaOnly(cachedPage) : cachedPage;
	} catch (error) {
		throw new StudioCMSCacheError('Error fetching page by ID');
	}
}

async function getPageBySlug(slug: string): Promise<PageDataCacheObject>;
async function getPageBySlug(
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
async function getPageBySlug(slug: string, metaOnly = false) {
	try {
		// Check if caching is disabled
		if (!isEnabled()) {
			const page = await sdk.GET.databaseEntry.pages.bySlug(slug);

			if (!page) {
				throw new StudioCMSCacheError('Page not found in database');
			}

			const pageData = pageDataReturn(page);

			return metaOnly ? convertCombinedPageDataToMetaOnly(pageData) : pageData;
		}

		const { data: tree } = await getFolderTree();

		// Retrieve the cached page
		const cachedPage = Array.from(pages.values()).find((page) => page.data.slug === slug);

		// Check if the page is not cached or the cache is expired
		if (!cachedPage || isCacheExpired(cachedPage)) {
			const page = await sdk.GET.databaseEntry.pages.bySlug(slug, tree);

			if (!page) {
				throw new StudioCMSCacheError('Page not found in database');
			}

			const returnPage = pageDataReturn(page);

			pages.set(page.id, returnPage);

			return metaOnly ? convertCombinedPageDataToMetaOnly(returnPage) : returnPage;
		}

		// Return the cached page
		return metaOnly ? convertCombinedPageDataToMetaOnly(cachedPage) : cachedPage;
	} catch (error) {
		throw new StudioCMSCacheError('Error fetching page by slug');
	}
}

async function createPage(data: {
	pageData: tsPageDataInsert;
	pageContent: CombinedInsertContent;
}): Promise<PageDataCacheObject> {
	try {
		if (!isEnabled()) {
			const newPage = await sdk.POST.databaseEntry.pages(data.pageData, data.pageContent);

			if (!newPage) {
				throw new StudioCMSCacheError('Error creating page');
			}

			const toReturn = await sdk.GET.databaseEntry.pages.byId(newPage.pageData[0].id);

			if (!toReturn) {
				throw new StudioCMSCacheError('Error creating page');
			}

			return pageDataReturn(toReturn);
		}

		const { data: tree } = await updateFolderTree();

		const newPage = await sdk.POST.databaseEntry.pages(data.pageData, data.pageContent);

		if (!newPage) {
			throw new StudioCMSCacheError('Error creating page');
		}

		const toReturn = await sdk.GET.databaseEntry.pages.byId(newPage.pageData[0].id, tree);

		if (!toReturn) {
			throw new StudioCMSCacheError('Error creating page');
		}

		pages.set(toReturn.id, pageDataReturn(toReturn));
		await updateFolderTreeWithNewPage(toReturn);

		return pageDataReturn(toReturn);
	} catch (error) {
		throw new StudioCMSCacheError('Error creating page');
	}
}

async function updatePageById(
	id: string,
	data: {
		pageData: tsPageDataSelect;
		pageContent: tsPageContentSelect;
	}
): Promise<PageDataCacheObject> {
	try {
		// Check if caching is disabled
		if (!isEnabled()) {
			await sdk.UPDATE.page(data.pageData);
			await sdk.UPDATE.pageContent(data.pageContent);

			const updatedData = await sdk.GET.databaseEntry.pages.byId(id);

			if (!updatedData) {
				throw new StudioCMSCacheError('Page not found in database');
			}

			return pageDataReturn(updatedData);
		}

		const { data: tree } = await updateFolderTree();

		// Update the page in the database
		await sdk.UPDATE.page(data.pageData);
		await sdk.UPDATE.pageContent(data.pageContent);

		// Retrieve the updated data
		const updatedData = await sdk.GET.databaseEntry.pages.byId(id, tree);

		if (!updatedData) {
			throw new StudioCMSCacheError('Page not found in database');
		}

		// Update the cache
		const returnData = pageDataReturn(updatedData);

		pages.set(id, returnData);
		clearFolderTree();

		return returnData;
	} catch (error) {
		throw new StudioCMSCacheError('Error updating page by ID');
	}
}

async function updatePageBySlug(
	slug: string,
	data: {
		pageData: tsPageDataSelect;
		pageContent: tsPageContentSelect;
	}
): Promise<PageDataCacheObject> {
	try {
		// Check if caching is disabled
		if (!isEnabled()) {
			await sdk.UPDATE.page(data.pageData);
			await sdk.UPDATE.pageContent(data.pageContent);

			const updatedData = await sdk.GET.databaseEntry.pages.bySlug(slug);

			if (!updatedData) {
				throw new StudioCMSCacheError('Page not found in database');
			}

			return pageDataReturn(updatedData);
		}

		const { data: tree } = await updateFolderTree();

		// Retrieve the cached page
		const cachedPage = Array.from(pages.values()).find((page) => page.data.slug === slug);

		// Check if the page is not cached
		if (!cachedPage) {
			throw new StudioCMSCacheError('Page not found in cache');
		}

		// Update the page in the database
		await sdk.UPDATE.page(data.pageData);
		await sdk.UPDATE.pageContent(data.pageContent);

		// Retrieve the updated data
		const updatedData = await sdk.GET.databaseEntry.pages.bySlug(slug, tree);

		// Check if the data was returned successfully
		if (!updatedData) {
			throw new StudioCMSCacheError('Page not found in database');
		}

		// Update the cache
		const returnData = pageDataReturn(updatedData);
		pages.set(updatedData.id, returnData);

		// Only clear folder tree if structural properties changed
		if (
			data.pageData.title !== cachedPage.data.title ||
			data.pageData.parentFolder !== cachedPage.data.parentFolder
		) {
			clearFolderTree();
		}

		// Return the data
		return returnData;
	} catch (error) {
		throw new StudioCMSCacheError('Error updating page by slug');
	}
}

export const cacheModule = {
	GET: {
		page: {
			byId: getPageById,
			bySlug: getPageBySlug,
		},
		pages: getAllPages,
		folderPages: folderPages,
		siteConfig: getSiteConfig,
		latestVersion: getVersion,
		folderTree: getFolderTree,
		pageFolderTree: getPageFolderTree,
		folderList: getFolderList,
		folder: sdk.GET.databaseEntry.folder,
		databaseTable: sdk.GET.databaseTable,
	},
	POST: {
		page: createPage,
		folder: async (data: tsPageFolderInsert) => {
			const newEntry = await sdk.POST.databaseEntry.folder(data);
			clearFolderTree();
			await updateFolderTree();
			await updateFolderList();
			return newEntry;
		},
	},
	CLEAR: {
		page: {
			byId: clearPageById,
			bySlug: clearPageBySlug,
		},
		pages: clearAllPages,
		latestVersion: clearVersion,
		folderTree: clearFolderTree,
		folderList: clearFolderList,
	},
	UPDATE: {
		page: {
			byId: updatePageById,
			bySlug: updatePageBySlug,
		},
		siteConfig: updateSiteConfig,
		latestVersion: updateVersion,
		folderTree: updateFolderTree,
		folderList: updateFolderList,
		folder: async (data: tsPageFolderSelect) => {
			const updatedEntry = await sdk.UPDATE.folder(data);
			clearFolderTree();
			await updateFolderTree();
			await updateFolderList();
			return updatedEntry;
		},
	},
	DELETE: {
		page: async (id: string) => {
			await sdk.DELETE.page(id);
			clearAllPages();
		},
		folder: async (id: string) => {
			await sdk.DELETE.folder(id);
			clearFolderTree();
			await updateFolderTree();
			await updateFolderList();
		},
	},
	db: sdk.db,
	diffTracking: sdk.diffTracking,
};
