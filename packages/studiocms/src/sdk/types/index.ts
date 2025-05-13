import type {
	CacheConfig,
	ProcessedCacheConfig,
	ProcessedSDKConfig,
} from '../../schemas/config/sdk.js';
import type { cacheModule } from '../cache-core.js';
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
} from './tableDefs.js';
import type {
	CombinedInsertContent,
	tsDiffTrackingInsert,
	tsDiffTrackingSelect,
	tsEmailVerificationTokensInsert,
	tsEmailVerificationTokensSelect,
	tsNotificationSettingsInsert,
	tsNotificationSettingsSelect,
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
	tsUserResetTokensInsert,
	tsUserResetTokensSelect,
	tsUsersInsert,
	tsUsersSelect,
	tsUsersUpdate,
} from './tsAlias.js';

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
	tsEmailVerificationTokensInsert,
	tsEmailVerificationTokensSelect,
	tsNotificationSettingsInsert,
	tsNotificationSettingsSelect,
	tsUserResetTokensInsert,
	tsUserResetTokensSelect,
};

export type PaginateInput = {
	limit: number;
	offset: number;
};

export type MetaOnlyPageData = Omit<CombinedPageData, 'multiLangContent' | 'defaultContent'>;

export type PageDataReturnType<T> = T extends CombinedPageData
	? MetaOnlyPageData
	: MetaOnlyPageData[];

export type PageDataCacheReturnType<T> = T extends PageDataCacheObject
	? MetaOnlyPageDataCacheObject
	: MetaOnlyPageDataCacheObject[];

export interface diffItem {
	id: string;
	userId: string;
	pageId: string;
	timestamp: Date | null;
	pageMetaData: unknown;
	pageContentStart: string;
	diff: string | null;
}

export interface diffReturn extends Omit<diffItem, 'pageMetaData'> {
	pageMetaData: {
		start: Partial<tsPageDataSelect>;
		end: Partial<tsPageDataSelect>;
	};
}

export type DiffReturnType<T> = T extends diffItem ? diffReturn : diffReturn[];

export interface FolderNode {
	id: string;
	name: string;
	page: boolean;
	pageData: CombinedPageData | null;
	children: FolderNode[];
}

export interface FolderListItem {
	id: string;
	name: string;
	parent?: string | null;
}

export type AstroDBVirtualModule = typeof import('astro:db');

// ../../schemas/config/sdk.ts
export type { CacheConfig, ProcessedCacheConfig, ProcessedSDKConfig };

/**
 * Type representing the return type of the `STUDIOCMS_SDK_CACHEModule` function.
 */
export type STUDIOCMS_SDK_CACHE = typeof cacheModule;

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
 * Represents a cache object for page data.
 * Extends the BaseCacheObject interface.
 *
 * @interface MetaOnlyPageDataCacheObject
 * @extends {BaseCacheObject}
 *
 * @property {MetaOnlyPageData} data - The combined page data to be cached.
 */
export interface MetaOnlyPageDataCacheObject extends BaseCacheObject {
	data: MetaOnlyPageData;
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

/**
 * Represents a cache object for folder tree data.
 * Extends the BaseCacheObject interface.
 *
 * @interface FolderTreeCacheObject
 * @extends {BaseCacheObject}
 *
 * @property {FolderNode[]} data - The folder tree data to be cached.
 */
export interface FolderTreeCacheObject extends BaseCacheObject {
	data: FolderNode[];
}

/**
 * Represents a cache object for folder list data.
 * Extends the BaseCacheObject interface.
 *
 * @interface FolderListCacheObject
 * @extends {BaseCacheObject}
 *
 * @property {FolderListItem[]} data - The folder list data to be cached.
 */
export interface FolderListCacheObject extends BaseCacheObject {
	data: FolderListItem[];
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
	authorData: tsUsersSelect | undefined;
	contributorsData: tsUsersSelect[];
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
