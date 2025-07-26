import type {
	CacheConfig,
	ProcessedCacheConfig,
	ProcessedSDKConfig,
} from '../../schemas/config/sdk.js';
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

/**
 * Represents a cache map that combines the immutability of `ReadonlyMap` with the mutability of `Map`.
 *
 * @template K - The type of keys in the map.
 * @template V - The type of values in the map.
 *
 * @remarks
 * This type allows both read-only and mutable operations on the map, which can be useful for scenarios
 * where you need to enforce read-only access in some contexts while allowing mutation in others.
 */
export type CacheMap<K, V> = ReadonlyMap<K, V> & Map<K, V>;

/**
 * Input parameters for paginated queries.
 *
 * @property limit - The maximum number of items to return.
 * @property offset - The number of items to skip before starting to collect the result set.
 */
export type PaginateInput = {
	limit: number;
	offset: number;
};

/**
 * Represents page data containing only metadata fields, excluding multilingual and default content.
 *
 * This type omits the `multiLangContent` and `defaultContent` properties from `CombinedPageData`.
 */
export type MetaOnlyPageData = Omit<CombinedPageData, 'multiLangContent' | 'defaultContent'>;

/**
 * Conditional type that returns either `MetaOnlyPageData` or an array of `MetaOnlyPageData`
 * based on whether the generic type `T` extends `CombinedPageData`.
 *
 * @template T - The type to check against `CombinedPageData`.
 * @returns If `T` extends `CombinedPageData`, returns `MetaOnlyPageData`; otherwise, returns `MetaOnlyPageData[]`.
 */
export type PageDataReturnType<T> = T extends CombinedPageData
	? MetaOnlyPageData
	: MetaOnlyPageData[];

/**
 * Determines the return type for page data cache operations based on the input type.
 *
 * If the generic type `T` extends `PageDataCacheObject`, the return type is `MetaOnlyPageDataCacheObject`.
 * Otherwise, the return type is an array of `MetaOnlyPageDataCacheObject`.
 *
 * @template T - The type to check against `PageDataCacheObject`.
 */
export type PageDataCacheReturnType<T> = T extends PageDataCacheObject
	? MetaOnlyPageDataCacheObject
	: MetaOnlyPageDataCacheObject[];

/**
 * Represents a single difference item for a page, including metadata and content changes.
 *
 * @property id - Unique identifier for the diff item.
 * @property userId - Identifier of the user who made the change.
 * @property pageId - Identifier of the page associated with the diff.
 * @property timestamp - The date and time when the diff was created, or null if not set.
 * @property pageMetaData - Metadata associated with the page; type is unknown.
 * @property pageContentStart - The initial content of the page before the diff.
 * @property diff - The difference content as a string, or null if not available.
 */
export interface diffItem {
	id: string;
	userId: string;
	pageId: string;
	timestamp: Date | null;
	pageMetaData: unknown;
	pageContentStart: string;
	diff: string | null;
}

/**
 * Represents the result of a diff operation, extending {@link diffItem} but replacing the `pageMetaData` property.
 *
 * @remarks
 * The `pageMetaData` property contains the starting and ending states of page metadata,
 * each represented as a partial selection of {@link tsPageDataSelect}.
 *
 * @see diffItem
 * @see tsPageDataSelect
 */
export interface diffReturn extends Omit<diffItem, 'pageMetaData'> {
	pageMetaData: {
		start: Partial<tsPageDataSelect>;
		end: Partial<tsPageDataSelect>;
	};
}

/**
 * Determines the return type based on whether the generic type `T` extends `diffItem`.
 * If `T` extends `diffItem`, returns `diffReturn`; otherwise, returns an array of `diffReturn`.
 *
 * @template T - The type to check against `diffItem`.
 * @returns `diffReturn` if `T` extends `diffItem`, otherwise `diffReturn[]`.
 */
export type DiffReturnType<T> = T extends diffItem ? diffReturn : diffReturn[];

/**
 * Represents a node in a folder structure, which may contain child nodes and page data.
 *
 * @property id - Unique identifier for the folder node.
 * @property name - Name of the folder node.
 * @property page - Indicates whether this node represents a page.
 * @property pageData - Data associated with the page, or `null` if not applicable.
 * @property children - Array of child folder nodes.
 */
export interface FolderNode {
	id: string;
	name: string;
	page: boolean;
	pageData: CombinedPageData | null;
	children: FolderNode[];
}

/**
 * Represents a folder item in a list, including its unique identifier, name, and optional parent folder.
 *
 * @property id - The unique identifier for the folder.
 * @property name - The display name of the folder.
 * @property parent - The identifier of the parent folder, or `null` if the folder is at the root level.
 */
export interface FolderListItem {
	id: string;
	name: string;
	parent?: string | null;
}

/**
 * Represents the type of the virtual module imported from 'astro:db'.
 * This type can be used to reference the shape and exports of the Astro DB virtual module
 * within TypeScript code, enabling type-safe interactions with its API.
 */
export type AstroDBVirtualModule = typeof import('astro:db');

// ../../schemas/config/sdk.ts
export type { CacheConfig, ProcessedCacheConfig, ProcessedSDKConfig };

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
	pageData: tsPageDataSelect;
	pageContent: CombinedInsertContent;
}

/**
 * Represents an array of PageInsert objects.
 */
export type MultiPageInsert = PageInsert[];
