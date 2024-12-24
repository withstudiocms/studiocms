/// <reference types="@astrojs/db" />
import type {
	CacheConfig,
	ProcessedCacheConfig,
	ProcessedSDKConfig,
} from '../../schemas/config/sdk';
import type StudioCMSSDK from '../StudioCMSSDK';
import type StudioCMSVirtualCache from '../StudioCMSVirtualCache';
import type {
	AvailableLists,
	CombinedRank,
	DatabaseTables,
	PageContentReturnId,
	PageDataCategoriesInsertResponse,
	PageDataReturnId,
	PageDataStripped,
	PageDataTagsInsertResponse,
	SingleRank,
	SiteConfig,
} from './tableDefs';
import type {
	CombinedInsertContent,
	tsDiffTrackingInsert,
	tsDiffTrackingSelect,
	tsOAuthAccountsSelect,
	tsPageContentInsert,
	tsPageContentSelect,
	tsPageDataCategoriesInsert,
	tsPageDataCategoriesSelect,
	tsPageDataInsert,
	tsPageDataSelect,
	tsPageDataTagsInsert,
	tsPageDataTagsSelect,
	tsPageFolderInsert,
	tsPageFolderSelect,
	tsPermissionsInsert,
	tsPermissionsSelect,
	tsSessionTableInsert,
	tsSessionTableSelect,
	tsSiteConfigInsert,
	tsSiteConfigSelect,
	tsUsersInsert,
	tsUsersSelect,
	tsUsersUpdate,
} from './tsAlias';

// tableDefs.ts
export type {
	AvailableLists,
	CombinedRank,
	DatabaseTables,
	PageContentReturnId,
	PageDataCategoriesInsertResponse,
	PageDataReturnId,
	PageDataStripped,
	PageDataTagsInsertResponse,
	SingleRank,
	SiteConfig,
};

// tsAlias.ts
export type {
	tsDiffTrackingInsert,
	tsDiffTrackingSelect,
	CombinedInsertContent,
	tsOAuthAccountsSelect,
	tsPageContentInsert,
	tsPageContentSelect,
	tsPageDataCategoriesInsert,
	tsPageDataCategoriesSelect,
	tsPageDataInsert,
	tsPageDataSelect,
	tsPageDataTagsInsert,
	tsPageDataTagsSelect,
	tsPermissionsSelect,
	tsPermissionsInsert,
	tsSiteConfigInsert,
	tsSessionTableSelect,
	tsSiteConfigSelect,
	tsUsersSelect,
	tsUsersInsert,
	tsSessionTableInsert,
	tsUsersUpdate,
	tsPageFolderInsert,
	tsPageFolderSelect,
};

export interface FolderNode {
	id: string;
	name: string;
	children: FolderNode[];
	page?: boolean;
}

export type AstroDBVirtualModule = typeof import('astro:db');

// ../../schemas/config/sdk.ts
export type { CacheConfig, ProcessedCacheConfig, ProcessedSDKConfig };

/**
 * Type representing the constructor of the StudioCMSSDK class.
 */
export type STUDIOCMS_SDKConstructor = typeof StudioCMSSDK;

/**
 * Represents an instance of the STUDIOCMS SDK.
 */
export type STUDIOCMS_SDK = InstanceType<STUDIOCMS_SDKConstructor>;

/**
 * Type definition for the constructor of the StudioCMS SDK Cache.
 *
 * This type represents the constructor function of the `StudioCMSVirtualCache` class.
 */
export type STUDIOCMS_SDK_CACHEConstructor = typeof StudioCMSVirtualCache;

/**
 * Type representing an instance of the STUDIOCMS SDK cache.
 *
 * This type is derived from the constructor type `STUDIOCMS_SDK_CACHEConstructor`.
 * It is used to define the shape of the cache instance within the STUDIOCMS SDK.
 */
export type STUDIOCMS_SDK_CACHEInstance = InstanceType<STUDIOCMS_SDK_CACHEConstructor>;

/**
 * Type representing the return type of the `STUDIOCMS_SDK_CACHEModule` function.
 */
export type STUDIOCMS_SDK_CACHE = STUDIOCMS_SDK_CACHEInstance['cacheModule'];

/**
 * Represents a base cache object with a timestamp of the last cache update.
 */
export interface BaseCacheObject {
	lastCacheUpdate: Date;
}

/**
 * Represents a cache object for page data.
 * Extends the BaseCacheObject interface.
 *
 * @interface PageDataCacheObject
 * @extends {BaseCacheObject}
 *
 * @property {CombinedPageData} data - The combined page data to be cached.
 */
export interface PageDataCacheObject extends BaseCacheObject {
	data: CombinedPageData;
}

/**
 * Represents a cache object for site configuration.
 * Extends the BaseCacheObject interface.
 *
 * @interface SiteConfigCacheObject
 * @extends {BaseCacheObject}
 *
 * @property {SiteConfig} data - The site configuration data.
 */
export interface SiteConfigCacheObject extends BaseCacheObject {
	data: SiteConfig;
}

/**
 * Represents a cache object that includes version information.
 *
 * @extends BaseCacheObject
 *
 * @property {string} version - The version of the cache object.
 */
export interface VersionCacheObject extends BaseCacheObject {
	version: string;
}

export interface FolderTreeCacheObject extends BaseCacheObject {
	data: FolderNode[];
}

/**
 * Represents a cache object that stores pages and site configuration data.
 */
export interface StudioCMSCacheObject {
	pages: Map<string, PageDataCacheObject>;
	siteConfig: SiteConfigCacheObject | undefined;
	version: VersionCacheObject | undefined;
}

/**
 * Represents the structure for adding a database entry for a page.
 *
 * @property {PageDataReturnId[]} pageData - An array of page data objects with return IDs.
 * @property {PageContentReturnId[]} pageContent - An array of page content objects with return IDs.
 */
export type addDatabaseEntryInsertPage = {
	pageData: PageDataReturnId[];
	pageContent: PageContentReturnId[];
};

/**
 * Interface representing combined user data.
 *
 * This interface extends `tsUsersSelect` and includes additional properties
 * for OAuth data and permissions data.
 *
 * @interface CombinedUserData
 * @extends {tsUsersSelect}
 *
 * @property {tsOAuthAccountsSelect[] | undefined} oAuthData - An array of OAuth account data or undefined.
 * @property {tsPermissionsSelect | undefined} permissionsData - Permissions data or undefined.
 */
export interface CombinedUserData extends tsUsersSelect {
	oAuthData: tsOAuthAccountsSelect[] | undefined;
	permissionsData: tsPermissionsSelect | undefined;
}

/**
 * Represents the combined data for a page, extending the stripped page data.
 *
 * @interface CombinedPageData
 * @extends PageDataStripped
 *
 * @property {string[]} contributorIds - An array of contributor IDs associated with the page.
 * @property {tsPageDataCategoriesSelect[]} categories - An array of categories selected for the page.
 * @property {tsPageDataTagsSelect[]} tags - An array of tags selected for the page.
 * @property {tsPageContentSelect[]} content - An array of content selected for the page.
 */
export interface CombinedPageData extends PageDataStripped {
	contributorIds: string[];
	categories: tsPageDataCategoriesSelect[];
	tags: tsPageDataTagsSelect[];
	multiLangContent: tsPageContentSelect[];
	defaultContent: tsPageContentSelect | undefined;
	urlRoute: string;
}

/**
 * Interface representing the response received after a deletion operation.
 *
 * @property {string} status - The status of the deletion operation.
 * @property {string} message - A message providing additional information about the deletion operation.
 */
export interface DeletionResponse {
	status: 'success' | 'error';
	message: string;
}

/**
 * Represents the data required to insert a new page.
 */
export interface PageInsert {
	pageData: tsPageDataInsert;
	pageContent: CombinedInsertContent;
}

/**
 * Represents an array of PageInsert objects.
 */
export type MultiPageInsert = PageInsert[];
