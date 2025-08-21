import type { z } from 'astro/zod';
import type { Schema } from '../../../effect.js';
import type {
	CacheConfig,
	ProcessedCacheConfig,
	ProcessedSDKConfig,
} from '../../../schemas/config/sdk.js';
import type {
	PageContentReturnId,
	PageDataReturnId,
	PageDataStripped,
	SiteConfig,
} from './tableDefs.js';
import type {
	CombinedInsertContent,
	tsOAuthAccountsSelect,
	tsPageContentSelect,
	tsPageDataCategoriesSelect,
	tsPageDataSelect,
	tsPageDataTagsSelect,
	tsPermissionsSelect,
	tsPluginDataSelect,
	tsUsersSelect,
} from './tsAlias.js';

export type * from './tableDefs.js';
export type * from './tsAlias.js';

/**
 * Base options for using plugin data.
 *
 * @template T - The type of the data object.
 * @property [Type] - An optional type definition for the data.
 * @property [validator] - Optional validator options for the data type.
 */
export interface UsePluginDataOptsBase<T extends Schema.Struct<Schema.Struct.Fields> | object> {
	Type?: T;
	validator?: ValidatorOptions<T>;
}

/**
 * Options for using plugin data, extending the base options with an entry identifier.
 *
 * @template T - The type of the plugin data object.
 * @extends UsePluginDataOptsBase<T>
 *
 * @property entryId - The unique identifier for the entry associated with the plugin data.
 */
export interface UsePluginDataOpts<T extends Schema.Struct<Schema.Struct.Fields> | object>
	extends UsePluginDataOptsBase<T> {
	entryId: string;
}

/**
 * Represents a partial implementation of the `UsePluginDataOpts` type for a given object type `T`.
 *
 * This type is useful when you want to provide only a subset of the properties defined in `UsePluginDataOpts<T>`.
 *
 * @typeParam T - The object type for which the plugin data options are defined.
 */
export type UserPluginDataOptsImplementation<
	T extends Schema.Struct<Schema.Struct.Fields> | object,
> = Partial<UsePluginDataOpts<T>>;

/**
 * Represents a plugin data entry with a strongly-typed `data` property.
 *
 * @template T - The type of the `data` property.
 * @extends Omit<tsPluginDataSelect, 'data'>
 * @property {T} data - The plugin-specific data payload.
 */
export interface PluginDataEntry<T extends object> extends Omit<tsPluginDataSelect, 'data'> {
	data: T;
}

/**
 * Represents a JSON validator function for a specific type.
 *
 * @template T - The type that the validator function checks for.
 * @property jsonFn - A type guard function that determines if the provided data is of type T.
 */
export interface JSONValidatorFn<T> {
	jsonFn: (data: unknown) => data is T;
}

/**
 * Interface representing a validator for an effect schema.
 *
 * @typeParam T - The type of the value that the schema validates.
 *
 * @property effectSchema - The schema used for validation, which takes a value of type `T` and returns either a `ParseError` or `never`.
 */
// biome-ignore lint/suspicious/noExplicitAny: This is a generic type for the plugin data.
export interface EffectSchemaValidator<E extends Schema.Struct<any>> {
	effectSchema: E;
}

/**
 * Interface representing a validator that uses a Zod schema to validate data of type `T`.
 *
 * @template T - The type of data to be validated.
 * @property zodSchema - The Zod schema instance used for validation.
 */
export interface ZodValidator<T> {
	zodSchema: z.ZodSchema<T>;
}

/**
 * Represents the available validator options for a given type `T`.
 *
 * This type is a union of supported validator types:
 * - `JSONValidatorFn<T>`: A function-based JSON validator for type `T`.
 * - `EffectSchemaValidator<T>`: A validator using the Effect schema for type `T`.
 * - `ZodValidator<T>`: A validator using the Zod schema for type `T`.
 *
 * @template T - The type to be validated.
 *
 * @example
 * ```typescript
 * // The Interface for a User type
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * // Example of defining a JSON validator Fn for a User type
 * const userValidator: ValidatorOptions<User> = {
 *   jsonFn: (data: unknown): data is User => {
 *     return (
 *       typeof data === 'object' &&
 *       data !== null &&
 *       'id' in data &&
 *       'name' in data &&
 *       'email' in data &&
 *       typeof (data as any).id === 'number' &&
 *       typeof (data as any).name === 'string' &&
 *       typeof (data as any).email === 'string'
 *     );
 *   }
 * };
 *
 * // Example of defining an Effect schema validator for a User type
 * import { Schema } from 'studiocms/effect';
 *
 * const userEffectSchema = Schema.Struct({
 *  id: Schema.Number,
 *  name: Schema.String,
 *  email: Schema.String
 * });
 *
 * type UserEffectSchema = (typeof userEffectSchema)['Type'];
 * type UserEffectSchemaFields = (typeof userEffectSchema)['fields'];
 *
 * const userEffectValidator: ValidatorOptions<UserEffectSchema, UserEffectSchemaFields> = {
 *   effectSchema: userEffectSchema
 * };
 *
 * // Example of defining a Zod validator for a User type
 * import { z } from 'astro/zod';
 *
 * const userZodValidator: ValidatorOptions<User> = {
 *   zodSchema: z.object({
 *     id: z.number(),
 *     name: z.string(),
 *     email: z.string()
 *   })
 * };
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: This is a generic type for the plugin data.
export type ValidatorOptions<T extends Schema.Struct<any> | object> = T extends Schema.Struct<any>
	? EffectSchemaValidator<T>
	: JSONValidatorFn<T> | ZodValidator<T>;

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

export interface PluginDataCacheObject extends BaseCacheObject {
	data: tsPluginDataSelect;
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
