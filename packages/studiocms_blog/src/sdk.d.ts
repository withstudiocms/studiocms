declare module 'studiocms:sdk' {
	const mod: typeof import('studiocms/sdk/base').studioCMS_SDK;
	export default mod;
}

declare module 'studiocms:sdk/types' {
	export type AvailableLists = import('studiocms/sdk/types').AvailableLists;
	export type CombinedRank = import('studiocms/sdk/types').CombinedRank;
	export type DatabaseTables = import('studiocms/sdk/types').DatabaseTables;
	export type PageContentReturnId = import('studiocms/sdk/types').PageContentReturnId;
	export type PageDataCategoriesInsertResponse = import(
		'studiocms/sdk/types'
	).PageDataCategoriesInsertResponse;
	export type PageDataReturnId = import('studiocms/sdk/types').PageDataReturnId;
	export type PageDataStripped = import('studiocms/sdk/types').PageDataStripped;
	export type PageDataTagsInsertResponse = import('studiocms/sdk/types').PageDataTagsInsertResponse;
	export type SingleRank = import('studiocms/sdk/types').SingleRank;
	export type SiteConfig = import('studiocms/sdk/types').SiteConfig;

	export type tsDiffTrackingInsert = import('studiocms/sdk/types').tsDiffTrackingInsert;
	export type tsDiffTrackingSelect = import('studiocms/sdk/types').tsDiffTrackingSelect;
	export type CombinedInsertContent = import('studiocms/sdk/types').CombinedInsertContent;
	export type tsOAuthAccountsSelect = import('studiocms/sdk/types').tsOAuthAccountsSelect;
	export type tsPageContentInsert = import('studiocms/sdk/types').tsPageContentInsert;
	export type tsPageContentSelect = import('studiocms/sdk/types').tsPageContentSelect;
	export type tsPageDataCategoriesInsert = import('studiocms/sdk/types').tsPageDataCategoriesInsert;
	export type tsPageDataCategoriesSelect = import('studiocms/sdk/types').tsPageDataCategoriesSelect;
	export type tsPageDataInsert = import('studiocms/sdk/types').tsPageDataInsert;
	export type tsPageDataSelect = import('studiocms/sdk/types').tsPageDataSelect;
	export type tsPageDataTagsInsert = import('studiocms/sdk/types').tsPageDataTagsInsert;
	export type tsPageDataTagsSelect = import('studiocms/sdk/types').tsPageDataTagsSelect;
	export type tsSiteConfigInsert = import('studiocms/sdk/types').tsSiteConfigInsert;
	export type tsSiteConfigSelect = import('studiocms/sdk/types').tsSiteConfigSelect;
	export type tsUsersInsert = import('studiocms/sdk/types').tsUsersInsert;
	export type tsUsersSelect = import('studiocms/sdk/types').tsUsersSelect;
	export type tsUsersUpdate = import('studiocms/sdk/types').tsUsersUpdate;
	export type tsPermissionsInsert = import('studiocms/sdk/types').tsPermissionsInsert;
	export type tsPermissionsSelect = import('studiocms/sdk/types').tsPermissionsSelect;
	export type tsSessionTableInsert = import('studiocms/sdk/types').tsSessionTableInsert;
	export type tsSessionTableSelect = import('studiocms/sdk/types').tsSessionTableSelect;

	export type addDatabaseEntryInsertPage = import('studiocms/sdk/types').addDatabaseEntryInsertPage;
	export type CombinedUserData = import('studiocms/sdk/types').CombinedUserData;
	export type CombinedPageData = import('studiocms/sdk/types').CombinedPageData;
	export type DeletionResponse = import('studiocms/sdk/types').DeletionResponse;
}

declare module 'studiocms:sdk/cache' {
	const studioCMS_SDK_Cache: import('studiocms/sdk/cache').STUDIOCMS_SDK_CACHE;
	export default studioCMS_SDK_Cache;

	export type STUDIOCMS_SDK_CACHE = import('studiocms/sdk/cache').STUDIOCMS_SDK_CACHE;
	export type PageDataCacheObject = import('studiocms/sdk/cache').PageDataCacheObject;
	export type SiteConfigCacheObject = import('studiocms/sdk/cache').SiteConfigCacheObject;
	export type VersionCacheObject = import('studiocms/sdk/cache').VersionCacheObject;
}
