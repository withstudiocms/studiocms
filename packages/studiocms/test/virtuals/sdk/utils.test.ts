/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import { SDKCoreError, StudioCMS_SDK_Error } from '../../../src/virtuals/sdk/errors';
import type { StudioCMSSiteConfig } from '../../../src/virtuals/sdk/modules/config';
import type {
	BaseCacheObject,
	CombinedPageData,
	FolderListItem,
	FolderNode,
	PageDataCacheObject,
	tsPageDataSelect,
} from '../../../src/virtuals/sdk/types/index';
import {
	_ClearUnknownError,
	_clearLibSQLError,
	CacheContext,
	type CachedContext,
	cacheConfig,
	convertCombinedPageDataToMetaOnly,
	filterPagesByDraftAndIndex,
	folderListReturn,
	folderTreeReturn,
	isCacheEnabled,
	isCacheExpired,
	pageDataReturn,
	siteConfigReturn,
	versionReturn,
} from '../../../src/virtuals/sdk/utils';

// Mocks
// @ts-expect-error Mocked
const mockFolderNode: FolderNode = { id: '1', name: 'root', children: [] };
const mockFolderListItem: FolderListItem = { id: '1', name: 'folder' };
const mockCombinedPageData: CombinedPageData = {
	id: 'page1',
	slug: 'home',
	// @ts-expect-error Mocked
	defaultContent: { title: 'Home', body: 'Welcome' },
	// @ts-expect-error Mocked
	multiLangContent: {},
	meta: { draft: false },
};
const mockSiteConfig: StudioCMSSiteConfig = { siteName: 'Test', theme: 'default' } as any;
const mockVersion = '1.0.0';

describe('folderTreeReturn', () => {
	it('returns FolderTreeCacheObject with correct data and timestamp', () => {
		const result = folderTreeReturn([mockFolderNode]);
		expect(result.data).toEqual([mockFolderNode]);
		expect(result.lastCacheUpdate).toBeInstanceOf(Date);
	});
});

describe('folderListReturn', () => {
	it('returns FolderListCacheObject with correct data and timestamp', () => {
		const result = folderListReturn([mockFolderListItem]);
		expect(result.data).toEqual([mockFolderListItem]);
		expect(result.lastCacheUpdate).toBeInstanceOf(Date);
	});
});

describe('pageDataReturn', () => {
	it('returns PageDataCacheObject with correct data and timestamp', () => {
		const result = pageDataReturn(mockCombinedPageData);
		expect(result.data).toEqual(mockCombinedPageData);
		expect(result.lastCacheUpdate).toBeInstanceOf(Date);
	});
});

describe('siteConfigReturn', () => {
	it('returns SiteConfigCacheObject with correct data and timestamp', () => {
		const result = siteConfigReturn(mockSiteConfig);
		expect(result.data).toEqual(mockSiteConfig);
		expect(result.lastCacheUpdate).toBeInstanceOf(Date);
	});
});

describe('versionReturn', () => {
	it('returns VersionCacheObject with correct version and timestamp', () => {
		const result = versionReturn(mockVersion);
		expect(result.version).toBe(mockVersion);
		expect(result.lastCacheUpdate).toBeInstanceOf(Date);
	});
});

describe('convertCombinedPageDataToMetaOnly', () => {
	it('removes defaultContent and multiLangContent from single object', () => {
		const cacheObj: PageDataCacheObject = pageDataReturn(mockCombinedPageData);
		const result = convertCombinedPageDataToMetaOnly(cacheObj);
		expect(result.data).not.toHaveProperty('defaultContent');
		expect(result.data).not.toHaveProperty('multiLangContent');
		expect(result.lastCacheUpdate).toEqual(cacheObj.lastCacheUpdate);
	});

	it('removes defaultContent and multiLangContent from array', () => {
		const cacheArr: PageDataCacheObject[] = [
			pageDataReturn(mockCombinedPageData),
			pageDataReturn({ ...mockCombinedPageData, id: 'page2' }),
		];
		const result = convertCombinedPageDataToMetaOnly(cacheArr);
		result.forEach((item, idx) => {
			expect(item.data).not.toHaveProperty('defaultContent');
			expect(item.data).not.toHaveProperty('multiLangContent');
			expect(item.lastCacheUpdate).toEqual(cacheArr[idx].lastCacheUpdate);
		});
	});
});

describe('isCacheExpired', () => {
	it('returns false if cache is fresh', () => {
		const entry: BaseCacheObject = { lastCacheUpdate: new Date() };
		expect(isCacheExpired(entry, 10000)).toBe(false);
	});

	it('returns true if cache is expired', () => {
		const oldDate = new Date(Date.now() - 10001);
		const entry: BaseCacheObject = { lastCacheUpdate: oldDate };
		expect(isCacheExpired(entry, 10000)).toBe(true);
	});
});

describe('filterPagesByDraftAndIndex', () => {
	const pages: tsPageDataSelect[] = [
		{ draft: false, slug: 'index' } as any,
		{ draft: true, slug: 'about' } as any,
		{ draft: null, slug: 'contact' } as any,
	];

	it('includes drafts if includeDrafts is true', () => {
		const result = filterPagesByDraftAndIndex(pages, true, false);
		expect(result.length).toBe(3);
	});

	it('excludes drafts if includeDrafts is false', () => {
		const result = filterPagesByDraftAndIndex(pages, false, false);
		expect(result.some((p) => p.draft === true)).toBe(false);
	});

	it('hides index if hideDefaultIndex is true', () => {
		const result = filterPagesByDraftAndIndex(pages, true, true);
		expect(result.some((p) => p.slug === 'index')).toBe(false);
	});
});

describe('error helpers', () => {
	it('_ClearUnknownError returns Effect.fail with SDKCoreError', async () => {
		const eff = _ClearUnknownError('test', 'fail');
		expect(await Effect.runPromiseExit(eff)).toMatchObject(
			Exit.fail(
				new SDKCoreError({ type: 'UNKNOWN', cause: new StudioCMS_SDK_Error('test Error: fail') })
			)
		);
	});

	it('_clearLibSQLError returns Effect.fail with SDKCoreError', async () => {
		const eff = _clearLibSQLError('db', 'fail');
		expect(await Effect.runPromiseExit(eff)).toMatchObject(
			Exit.fail(
				new SDKCoreError({
					type: 'LibSQLDatabaseError',
					cause: new StudioCMS_SDK_Error('db Error: fail'),
				})
			)
		);
	});
});

describe('cacheConfig and isCacheEnabled', () => {
	it('cacheConfig should be defined', () => {
		expect(cacheConfig).toBeDefined();
	});

	it('isCacheEnabled returns boolean', async () => {
		const result = await Effect.runPromise(isCacheEnabled);
		expect(typeof result).toBe('boolean');
	});
});

describe('CacheContext', () => {
	it('makeLayer returns a Layer', () => {
		const context: CachedContext = {
			pages: new Map(),
			siteConfig: new Map(),
			version: new Map(),
			folderTree: new Map(),
			pageFolderTree: new Map(),
			FolderList: new Map(),
			pluginData: new Map(),
		};
		const layer = CacheContext.makeLayer(context);
		expect(layer).toBeDefined();
	});

	it('makeProvide returns an Effect', () => {
		const context: CachedContext = {
			pages: new Map(),
			siteConfig: new Map(),
			version: new Map(),
			folderTree: new Map(),
			pageFolderTree: new Map(),
			FolderList: new Map(),
			pluginData: new Map(),
		};
		const eff = CacheContext.makeProvide(context);
		expect(eff).toBeDefined();
	});
});
