import { Effect } from 'effect';
import {
	AstroDB,
	SDKCore_Collectors,
	SDKCore_FolderTree,
	SDKCore_Generators,
	SDKCore_Parsers,
	SDKCore_Users,
} from './effect/index.js';
import { SDKCoreError } from './errors.js';
import { SDKCore_AUTH } from './modules/auth.js';
import { SDKCore_CLEAR } from './modules/clear.js';
import { SDKCore_DELETE } from './modules/delete.js';
import { SDKCore_DiffTracking } from './modules/diffTracking.js';
import { SDKCore_GET } from './modules/get.js';
import { SDKCore_INIT } from './modules/init.js';
import { SDKCore_NotificationSettings } from './modules/notificationSettings.js';
import { SDKCore_POST } from './modules/post.js';
import { SDKCore_ResetTokenBucket } from './modules/resetTokenBucket.js';
import { SDKCore_REST_API } from './modules/rest_api.js';
import { SDKCore_UPDATE } from './modules/update.js';
import type {
	CacheMap,
	CombinedPageData,
	CombinedUserData,
	FolderListCacheObject,
	FolderNode,
	FolderTreeCacheObject,
	MetaOnlyPageData,
	PageDataCacheObject,
	SiteConfigCacheObject,
	VersionCacheObject,
	tsPageDataSelect,
	tsPermissionsSelect,
	tsUsersSelect,
} from './types/index.js';
import { CacheContext, _ClearUnknownError, _clearLibSQLError } from './utils.js';

const pages: CacheMap<string, PageDataCacheObject> = new Map<string, PageDataCacheObject>();
const siteConfig: CacheMap<string, SiteConfigCacheObject> = new Map<
	string,
	SiteConfigCacheObject
>();
const version: CacheMap<string, VersionCacheObject> = new Map<string, VersionCacheObject>();
const folderTree: CacheMap<string, FolderTreeCacheObject> = new Map<
	string,
	FolderTreeCacheObject
>();
const pageFolderTree: CacheMap<string, FolderTreeCacheObject> = new Map<
	string,
	FolderTreeCacheObject
>();
const FolderList: CacheMap<string, FolderListCacheObject> = new Map<
	string,
	FolderListCacheObject
>();

export class SDKCore extends Effect.Service<SDKCore>()('studiocms/sdk/SDKCore', {
	dependencies: [
		SDKCore_FolderTree.Default,
		SDKCore_Generators.Default,
		SDKCore_Parsers.Default,
		SDKCore_Users.Default,
		SDKCore_Collectors.Default,
		SDKCore_CLEAR.Default,
		SDKCore_DELETE.Default,
		SDKCore_UPDATE.Default,
		SDKCore_POST.Default,
		SDKCore_REST_API.Default,
		SDKCore_GET.Default,
		SDKCore_ResetTokenBucket.Default,
		SDKCore_DiffTracking.Default,
		SDKCore_NotificationSettings.Default,
		SDKCore_AUTH.Default,
		SDKCore_INIT.Default,
		AstroDB.Default,
	],
	effect: Effect.gen(function* () {
		// Get Services
		const [
			{
				getFullPath,
				findNodeByPath,
				findNodesAlongPath,
				findNodesAlongPathToId,
				findNodeById,
				addPageToFolderTree,
				buildFolderTree,
				getAvailableFolders,
			},
			{ generateRandomIDNumber, generateRandomPassword, generateToken, testToken },
			{ parseIdNumberArray, parseIdStringArray },
			{ combineRanks, verifyRank, clearUserReferences },
			{ collectCategories, collectTags, collectPageData, collectUserData },
			dbService,
			CLEAR,
			DELETE,
			UPDATE,
			POST,
			REST_API,
			GET,
			resetTokenBucket,
			diffTracking,
			notificationSettings,
			AUTH,
			INIT,
		] = yield* Effect.all([
			SDKCore_FolderTree,
			SDKCore_Generators,
			SDKCore_Parsers,
			SDKCore_Users,
			SDKCore_Collectors,
			AstroDB,
			SDKCore_CLEAR,
			SDKCore_DELETE,
			SDKCore_UPDATE,
			SDKCore_POST,
			SDKCore_REST_API,
			SDKCore_GET,
			SDKCore_ResetTokenBucket,
			SDKCore_DiffTracking,
			SDKCore_NotificationSettings,
			SDKCore_AUTH,
			SDKCore_INIT,
		]);

		// Breakout service functions that need to be returned in this.
		const { db } = dbService;

		return {
			db,
			dbService,
			getFullPath,
			findNodeByPath,
			findNodesAlongPath,
			findNodesAlongPathToId,
			findNodeById,
			addPageToFolderTree,
			generateRandomIDNumber,
			generateRandomPassword,
			generateToken,
			testToken,
			parseIdNumberArray,
			parseIdStringArray,
			combineRanks,
			verifyRank,
			buildFolderTree,
			getAvailableFolders,
			clearUserReferences,
			collectCategories,
			collectTags,
			collectPageData,
			collectUserData,
			resetTokenBucket,
			diffTracking,
			notificationSettings,
			CLEAR,
			DELETE,
			REST_API,
			POST,
			UPDATE,
			GET,
			AUTH,
			INIT,
		};
	}),
}) {
	static Provide = Effect.provide(this.Default);
	static Cache = CacheContext.makeProvide({
		pages,
		FolderList,
		folderTree,
		pageFolderTree,
		siteConfig,
		version,
	});
}
