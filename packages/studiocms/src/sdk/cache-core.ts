import { Effect } from 'effect';
import { studiocmsSDKCore } from './core.js';
import { convertToVanilla } from './effect/convertToVanilla.js';
import { SDKCore } from './sdkCore.js';
import type {
	CombinedInsertContent,
	PaginateInput,
	SiteConfig,
	tsPageContentSelect,
	tsPageDataInsert,
	tsPageDataSelect,
	tsPageFolderInsert,
	tsPageFolderSelect,
} from './types/index.js';

const run = convertToVanilla(
	Effect.gen(function* () {
		const core = yield* SDKCore;
		return { ...core };
	}).pipe(Effect.provide(SDKCore.Default))
);

const sdkCore = studiocmsSDKCore();

/**
 * @deprecated
 */
export const cacheModule = {
	GET: {
		page: {
			byId: async (id: string) => await convertToVanilla(run.GET.page.byId(id), true),
			bySlug: async (slug: string) => await convertToVanilla(run.GET.page.bySlug(slug), true),
		},
		pages: async (
			includeDrafts?: boolean,
			hideDefaultIndex?: boolean,
			metaOnly?: false,
			paginate?: PaginateInput
		) =>
			await convertToVanilla(
				run.GET.pages(includeDrafts, hideDefaultIndex, metaOnly, paginate),
				true
			),
		folderPages: async (
			id: string,
			includeDrafts?: boolean,
			hideDefaultIndex?: boolean,
			metaOnly?: false,
			paginate?: PaginateInput
		) =>
			await convertToVanilla(
				run.GET.folderPages(id, includeDrafts, hideDefaultIndex, metaOnly, paginate),
				true
			),
		siteConfig: async () => await convertToVanilla(run.GET.siteConfig(), true),
		latestVersion: async () => await convertToVanilla(run.GET.latestVersion(), true),
		folderTree: async () => await convertToVanilla(run.GET.folderTree(), true),
		pageFolderTree: async (includeDrafts?: boolean, hideDefaultIndex?: boolean) =>
			await convertToVanilla(run.GET.pageFolderTree(hideDefaultIndex), true),
		folderList: async () => await convertToVanilla(run.GET.folderList(), true),
		folder: sdkCore.GET.databaseEntry.folder,
		databaseTable: sdkCore.GET.databaseTable,
	},
	POST: {
		page: async (data: {
			pageData: tsPageDataInsert;
			pageContent: CombinedInsertContent;
		}) => await convertToVanilla(run.POST.page(data), true),
		folder: async (data: tsPageFolderInsert) => await convertToVanilla(run.POST.folder(data), true),
	},
	CLEAR: {
		page: {
			byId: async (id: string) => await convertToVanilla(run.CLEAR.page.byId(id), true),
			bySlug: async (slug: string) => await convertToVanilla(run.CLEAR.page.bySlug(slug), true),
		},
		pages: async () => await convertToVanilla(run.CLEAR.pages(), true),
		latestVersion: async () => await convertToVanilla(run.CLEAR.latestVersion(), true),
		folderTree: async () => await convertToVanilla(run.CLEAR.folderTree(), true),
		folderList: async () => await convertToVanilla(run.CLEAR.folderList(), true),
	},
	UPDATE: {
		page: {
			byId: async (
				id: string,
				data: {
					pageData: tsPageDataSelect;
					pageContent: tsPageContentSelect;
				}
			) => await convertToVanilla(run.UPDATE.page.byId(id, data), true),
			bySlug: async (
				slug: string,
				data: {
					pageData: tsPageDataSelect;
					pageContent: tsPageContentSelect;
				}
			) => await convertToVanilla(run.UPDATE.page.bySlug(slug, data), true),
		},
		siteConfig: async (data: SiteConfig) =>
			await convertToVanilla(run.UPDATE.siteConfig(data), true),
		latestVersion: async () => await convertToVanilla(run.UPDATE.latestVersion(), true),
		folderTree: async () => await convertToVanilla(run.UPDATE.folderTree, true),
		folderList: async () => await convertToVanilla(run.UPDATE.folderList, true),
		folder: async (data: tsPageFolderSelect) =>
			await convertToVanilla(run.UPDATE.folder(data), true),
	},
	DELETE: {
		page: async (id: string) => await convertToVanilla(run.DELETE.page(id), true),
		folder: async (id: string) => await convertToVanilla(run.DELETE.folder(id), true),
	},
	db: sdkCore.db,
	diffTracking: sdkCore.diffTracking,
};
