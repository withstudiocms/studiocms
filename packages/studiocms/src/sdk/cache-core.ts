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

const run = await convertToVanilla(
	Effect.gen(function* () {
		const core = yield* SDKCore;
		return { ...core };
	}).pipe(Effect.provide(SDKCore.Default))
);

const sdkCore = await studiocmsSDKCore();

/**
 * @deprecated
 */
export const cacheModule = {
	GET: {
		page: {
			byId: async (id: string) => await convertToVanilla(run.GET.page.byId(id)),
			bySlug: async (slug: string) => await convertToVanilla(run.GET.page.bySlug(slug)),
		},
		pages: async (
			includeDrafts?: boolean,
			hideDefaultIndex?: boolean,
			metaOnly?: false,
			paginate?: PaginateInput
		) => await convertToVanilla(run.GET.pages(includeDrafts, hideDefaultIndex, metaOnly, paginate)),
		folderPages: async (
			id: string,
			includeDrafts?: boolean,
			hideDefaultIndex?: boolean,
			metaOnly?: false,
			paginate?: PaginateInput
		) =>
			await convertToVanilla(
				run.GET.folderPages(id, includeDrafts, hideDefaultIndex, metaOnly, paginate)
			),
		siteConfig: async () => await convertToVanilla(run.GET.siteConfig()),
		latestVersion: async () => await convertToVanilla(run.GET.latestVersion()),
		folderTree: async () => await convertToVanilla(run.GET.folderTree()),
		pageFolderTree: async (_includeDrafts?: boolean, hideDefaultIndex?: boolean) =>
			await convertToVanilla(run.GET.pageFolderTree(hideDefaultIndex)),
		folderList: async () => await convertToVanilla(run.GET.folderList()),
		folder: sdkCore.GET.databaseEntry.folder,
		databaseTable: sdkCore.GET.databaseTable,
	},
	POST: {
		page: async (data: {
			pageData: tsPageDataSelect;
			pageContent: CombinedInsertContent;
		}) => await convertToVanilla(run.POST.page(data)),
		folder: async (data: tsPageFolderSelect) => await convertToVanilla(run.POST.folder(data)),
	},
	CLEAR: {
		page: {
			byId: async (id: string) => await convertToVanilla(run.CLEAR.page.byId(id)),
			bySlug: async (slug: string) => await convertToVanilla(run.CLEAR.page.bySlug(slug)),
		},
		pages: async () => await convertToVanilla(run.CLEAR.pages()),
		latestVersion: async () => await convertToVanilla(run.CLEAR.latestVersion()),
		folderTree: async () => await convertToVanilla(run.CLEAR.folderTree()),
		folderList: async () => await convertToVanilla(run.CLEAR.folderList()),
	},
	UPDATE: {
		page: {
			byId: async (
				id: string,
				data: {
					pageData: tsPageDataSelect;
					pageContent: tsPageContentSelect;
				}
			) => await convertToVanilla(run.UPDATE.page.byId(id, data)),
			bySlug: async (
				slug: string,
				data: {
					pageData: tsPageDataSelect;
					pageContent: tsPageContentSelect;
				}
			) => await convertToVanilla(run.UPDATE.page.bySlug(slug, data)),
		},
		siteConfig: async (data: SiteConfig) => await convertToVanilla(run.UPDATE.siteConfig(data)),
		latestVersion: async () => await convertToVanilla(run.UPDATE.latestVersion()),
		folderTree: async () => await convertToVanilla(run.UPDATE.folderTree),
		folderList: async () => await convertToVanilla(run.UPDATE.folderList),
		folder: async (data: tsPageFolderSelect) => await convertToVanilla(run.UPDATE.folder(data)),
	},
	DELETE: {
		page: async (id: string) => await convertToVanilla(run.DELETE.page(id)),
		folder: async (id: string) => await convertToVanilla(run.DELETE.folder(id)),
	},
	db: sdkCore.db,
	diffTracking: sdkCore.diffTracking,
};
