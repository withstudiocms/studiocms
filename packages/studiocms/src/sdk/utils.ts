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

export interface CachedContext {
	pages: CacheMap<string, PageDataCacheObject>;
	siteConfig: CacheMap<string, SiteConfigCacheObject>;
	version: CacheMap<string, VersionCacheObject>;
	folderTree: CacheMap<string, FolderTreeCacheObject>;
	pageFolderTree: CacheMap<string, FolderTreeCacheObject>;
	FolderList: CacheMap<string, FolderListCacheObject>;
}

export class CacheContext extends Context.Tag('CacheContext')<CacheContext, CachedContext>() {
	static makeLayer = (context: CachedContext) => Layer.succeed(this, this.of(context));
	static makeProvide = (context: CachedContext) => Effect.provide(this.makeLayer(context));
}

export const cacheConfig = sdkConfig.cacheConfig;

export const isCacheEnabled = Effect.try(() => cacheConfig.enabled);

export const _ClearUnknownError = (id: string, cause: unknown) =>
	Effect.fail(
		new SDKCoreError({
			type: 'UNKNOWN',
			cause: new StudioCMS_SDK_Error(`${id} Error: ${cause}`),
		})
	);

export const _clearLibSQLError = (id: string, cause: unknown) =>
	Effect.fail(
		new SDKCoreError({
			type: 'LibSQLDatabaseError',
			cause: new StudioCMS_SDK_Error(`${id} Error: ${cause}`),
		})
	);

export function folderTreeReturn(data: FolderNode[]): FolderTreeCacheObject {
	return {
		data,
		lastCacheUpdate: new Date(),
	};
}

export function folderListReturn(data: FolderListItem[]): FolderListCacheObject {
	return {
		data,
		lastCacheUpdate: new Date(),
	};
}

export function pageDataReturn(data: CombinedPageData): PageDataCacheObject {
	return {
		data,
		lastCacheUpdate: new Date(),
	};
}

export function siteConfigReturn(siteConfig: SiteConfig): SiteConfigCacheObject {
	return {
		data: siteConfig,
		lastCacheUpdate: new Date(),
	};
}

export function versionReturn(version: string): VersionCacheObject {
	return {
		version,
		lastCacheUpdate: new Date(),
	};
}

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

export function isCacheExpired(entry: BaseCacheObject, lifetime = cacheConfig.lifetime): boolean {
	return new Date().getTime() - entry.lastCacheUpdate.getTime() > lifetime;
}

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
