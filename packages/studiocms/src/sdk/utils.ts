import { sdk as sdkConfig } from 'studiocms:config';
import { Context, Effect, Layer } from '../effect.js';
import { SDKCoreError, StudioCMS_SDK_Error } from './errors.js';
import type {
	BaseCacheObject,
	CacheMap,
	CombinedPageData,
	FolderListCacheObject,
	FolderListItem,
	FolderNode,
	FolderTreeCacheObject,
	PageDataCacheObject,
	PageDataCacheReturnType,
	SiteConfig,
	SiteConfigCacheObject,
	VersionCacheObject,
	tsPageDataSelect,
} from './types/index.js';

/**
 * Represents the cached context containing various cache maps for different data types.
 *
 * @property pages - Cache map storing page data objects, keyed by string.
 * @property siteConfig - Cache map storing site configuration objects, keyed by string.
 * @property version - Cache map storing version objects, keyed by string.
 * @property folderTree - Cache map storing folder tree objects, keyed by string.
 * @property pageFolderTree - Cache map storing page folder tree objects, keyed by string.
 * @property FolderList - Cache map storing folder list objects, keyed by string.
 */
export interface CachedContext {
	pages: CacheMap<string, PageDataCacheObject>;
	siteConfig: CacheMap<string, SiteConfigCacheObject>;
	version: CacheMap<string, VersionCacheObject>;
	folderTree: CacheMap<string, FolderTreeCacheObject>;
	pageFolderTree: CacheMap<string, FolderTreeCacheObject>;
	FolderList: CacheMap<string, FolderListCacheObject>;
}

/**
 * Represents a context for caching within the application.
 * 
 * @remarks
 * This class extends a tagged context using `Context.Tag`, allowing for type-safe context management.
 * 
 * @example
 * ```typescript
 * const cacheLayer = CacheContext.makeLayer(myCachedContext);
 * const providedEffect = CacheContext.makeProvide(myCachedContext);
 * ```
 * 
 * @method makeLayer
 * Creates a `Layer` that provides the given cached context.
 * 
 * @param context - The cached context to be provided.
 * @returns A `Layer` that provides the cached context.
 * 
 * @method makeProvide
 * Creates an `Effect` that provides the cached context using a layer.
 * 
 * @param context - The cached context to be provided.
 * @returns An `Effect` that provides the cached context.
 */
export class CacheContext extends Context.Tag('CacheContext')<CacheContext, CachedContext>() {
	static makeLayer = (context: CachedContext) => Layer.succeed(this, this.of(context));
	static makeProvide = (context: CachedContext) => Effect.provide(this.makeLayer(context));
}

/**
 * Exports the cache configuration object from the SDK configuration.
 * This configuration is used to control caching behavior within the SDK.
 *
 * @see sdkConfig.cacheConfig
 */
export const cacheConfig = sdkConfig.cacheConfig;

/**
 * Determines if caching is enabled based on the current cache configuration.
 * 
 * This function attempts to access the `enabled` property of `cacheConfig` within an `Effect.try` block,
 * which safely handles any errors that may occur during the retrieval.
 *
 * @returns An `Effect` that resolves to a boolean indicating whether caching is enabled.
 */
export const isCacheEnabled = Effect.try(() => cacheConfig.enabled);

/**
 * Creates an `Effect.fail` with a custom `SDKCoreError` of type 'UNKNOWN'.
 * The error message includes the provided `id` and the unknown `cause`.
 *
 * @param id - A string identifier for the error context.
 * @param cause - The unknown error cause to be included in the error message.
 * @returns An `Effect.fail` containing the constructed `SDKCoreError`.
 */
export const _ClearUnknownError = (id: string, cause: unknown) =>
	Effect.fail(
		new SDKCoreError({
			type: 'UNKNOWN',
			cause: new StudioCMS_SDK_Error(`${id} Error: ${cause}`),
		})
	);

/**
 * Creates an `Effect.fail` with a custom `SDKCoreError` for LibSQL database errors.
 *
 * @param id - Identifier or context for the error.
 * @param cause - The underlying cause of the error.
 * @returns An `Effect.fail` containing a `SDKCoreError` with type 'LibSQLDatabaseError' and a wrapped `StudioCMS_SDK_Error`.
 */
export const _clearLibSQLError = (id: string, cause: unknown) =>
	Effect.fail(
		new SDKCoreError({
			type: 'LibSQLDatabaseError',
			cause: new StudioCMS_SDK_Error(`${id} Error: ${cause}`),
		})
	);

/**
 * Returns a cache object containing the provided folder tree data and the current timestamp.
 *
 * @param data - An array of `FolderNode` objects representing the folder tree structure.
 * @returns A `FolderTreeCacheObject` containing the folder tree data and the time of cache update.
 */
export function folderTreeReturn(data: FolderNode[]): FolderTreeCacheObject {
	return {
		data,
		lastCacheUpdate: new Date(),
	};
}

/**
 * Creates a cache object for a list of folders.
 *
 * @param data - An array of `FolderListItem` representing the folder list.
 * @returns A `FolderListCacheObject` containing the folder list and the timestamp of the cache update.
 */
export function folderListReturn(data: FolderListItem[]): FolderListCacheObject {
	return {
		data,
		lastCacheUpdate: new Date(),
	};
}

/**
 * Creates a `PageDataCacheObject` containing the provided page data and the current timestamp.
 *
 * @param data - The combined page data to be cached.
 * @returns An object with the cached data and the time of cache update.
 */
export function pageDataReturn(data: CombinedPageData): PageDataCacheObject {
	return {
		data,
		lastCacheUpdate: new Date(),
	};
}

/**
 * Returns a cache object containing the provided site configuration and the current timestamp.
 *
 * @param siteConfig - The site configuration object to cache.
 * @returns An object containing the site configuration and the time of cache update.
 */
export function siteConfigReturn(siteConfig: SiteConfig): SiteConfigCacheObject {
	return {
		data: siteConfig,
		lastCacheUpdate: new Date(),
	};
}

/**
 * Creates a `VersionCacheObject` containing the provided version string and the current timestamp.
 *
 * @param version - The version string to include in the returned object.
 * @returns An object with the specified version and the current date as `lastCacheUpdate`.
 */
export function versionReturn(version: string): VersionCacheObject {
	return {
		version,
		lastCacheUpdate: new Date(),
	};
}

/**
 * Converts a `PageDataCacheObject` or an array of such objects to a meta-only representation,
 * removing `defaultContent` and `multiLangContent` from the `data` property.
 *
 * @typeParam T - Either a single `PageDataCacheObject` or an array of them.
 * @param data - The input object(s) containing page data and cache information.
 * @returns The meta-only representation of the input, preserving `lastCacheUpdate` and all properties of `data` except `defaultContent` and `multiLangContent`.
 */
export function convertCombinedPageDataToMetaOnly<
	T extends PageDataCacheObject[] | PageDataCacheObject,
>(data: T): PageDataCacheReturnType<T> {
	if (Array.isArray(data)) {
		return data.map(({ lastCacheUpdate, data: { defaultContent, multiLangContent, ...data } }) => ({
			lastCacheUpdate,
			data,
		})) as PageDataCacheReturnType<T>;
	}
	const {
		lastCacheUpdate,
		data: { defaultContent, multiLangContent, ...metaOnlyData },
	} = data;
	return {
		lastCacheUpdate,
		data: metaOnlyData,
	} as PageDataCacheReturnType<T>;
}

/**
 * Determines whether a cache entry has expired based on its last update time and a specified lifetime.
 *
 * @param entry - The cache entry object containing the last cache update timestamp.
 * @param lifetime - The maximum allowed lifetime (in milliseconds) for the cache entry before it is considered expired. Defaults to `cacheConfig.lifetime`.
 * @returns `true` if the cache entry has expired; otherwise, `false`.
 */
export function isCacheExpired(entry: BaseCacheObject, lifetime = cacheConfig.lifetime): boolean {
	return new Date().getTime() - entry.lastCacheUpdate.getTime() > lifetime;
}

/**
 * Filters an array of page data objects based on draft status and index slug.
 *
 * @param pages - The array of page data objects to filter.
 * @param includeDrafts - If `true`, includes pages marked as drafts; otherwise, excludes them.
 * @param hideDefaultIndex - If `true`, excludes pages with the slug `'index'`; otherwise, includes them.
 * @returns The filtered array of page data objects.
 */
export function filterPagesByDraftAndIndex(
	pages: tsPageDataSelect[],
	includeDrafts: boolean,
	hideDefaultIndex: boolean
): tsPageDataSelect[] {
	return pages.filter(
		({ draft, slug }) =>
			(includeDrafts || draft === false || draft === null) &&
			(!hideDefaultIndex || slug !== 'index')
	);
}
