import { Effect, genLogger } from '../../effect.js';
import { CacheContext, _ClearUnknownError, isCacheEnabled } from '../utils.js';

export class SDKCore_CLEAR extends Effect.Service<SDKCore_CLEAR>()(
	'studiocms/sdk/SDKCore/modules/clear',
	{
		dependencies: [],
		effect: genLogger('studiocms/sdk/SDKCore/modules/clear/effect')(function* () {
			const { pages, FolderList, folderTree, pageFolderTree, version } = yield* CacheContext;

			const CLEAR = {
				page: {
					byId: (id: string) =>
						Effect.gen(function* () {
							const status = yield* isCacheEnabled;
							if (!status) return;

							pages.delete(id);
							return;
						}).pipe(
							Effect.catchTags({
								UnknownException: (cause) => _ClearUnknownError('CLEAR.page.byId', cause),
							})
						),
					bySlug: (slug: string) =>
						Effect.gen(function* () {
							const status = yield* isCacheEnabled;
							if (!status) return;

							const keyIndex: string[] = [];

							for (const [key, cachedObject] of pages) {
								if (cachedObject.data.slug === slug) {
									keyIndex.push(key);
								}
							}

							for (const key of keyIndex) {
								pages.delete(key);
							}

							return;
						}).pipe(
							Effect.catchTags({
								UnknownException: (cause) => _ClearUnknownError('CLEAR.page.bySlug', cause),
							})
						),
				},
				pages: () =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;
						if (!status) return;

						pages.clear();
						pageFolderTree.clear();
						folderTree.clear();
						FolderList.clear();
						return;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _ClearUnknownError('CLEAR.pages', cause),
						})
					),
				latestVersion: () =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;
						if (!status) return;

						version.clear();
						return;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _ClearUnknownError('CLEAR.latestVersion', cause),
						})
					),
				folderTree: () =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;
						if (!status) return;

						folderTree.clear();
						pageFolderTree.clear();
						return;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _ClearUnknownError('CLEAR.folderTree', cause),
						})
					),
				folderList: () =>
					Effect.gen(function* () {
						const status = yield* isCacheEnabled;
						if (!status) return;

						FolderList.clear();
						return;
					}).pipe(
						Effect.catchTags({
							UnknownException: (cause) => _ClearUnknownError('CLEAR.folderList', cause),
						})
					),
			};

			return CLEAR;
		}),
	}
) {}
