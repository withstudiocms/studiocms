declare module 'astro:env/server' {
	export function getSecret(secret: string): string;
}

interface Window {
	theme: {
		setTheme: (theme: 'system' | 'dark' | 'light') => void;
		getTheme: () => 'system' | 'dark' | 'light';
		getSystemTheme: () => 'light' | 'dark';
		getDefaultTheme: () => 'system' | 'dark' | 'light';
	};
}

declare module 'studiocms:config' {
	export const config: import('./src/schemas/index.js').StudioCMSConfig;
	export default config;

	export const dashboardConfig: import('./src/schemas/index.js').StudioCMSConfig['dashboardConfig'];
	export const AuthConfig: import(
		'./src/schemas/index.js'
	).StudioCMSConfig['dashboardConfig']['AuthConfig'];
	export const developerConfig: import(
		'./src/schemas/index.js'
	).StudioCMSConfig['dashboardConfig']['developerConfig'];
	export const defaultFrontEndConfig: import(
		'./src/schemas/index.js'
	).StudioCMSConfig['defaultFrontEndConfig'];
	export const sdk: import('./src/schemas/index.js').StudioCMSConfig['sdk'];
}

declare module 'studiocms:version' {
	export const mod: string;
	export default mod;
}

declare module 'studiocms:ui/version' {
	export const mod: string;
	export default mod;
}

declare module 'studiocms:changelog' {
	export const mod: string;
	export default mod;
}

declare module 'studiocms:components' {
	export const Avatar: typeof import('./src/components/Avatar.astro').default;
	export const FormattedDate: typeof import('./src/components/FormattedDate.astro').default;
	export const GenericHeader: typeof import('./src/components/GenericHeader.astro').default;
	export const Navigation: typeof import('./src/components/Navigation.astro').default;
	export const Generator: typeof import('./src/components/Generator.astro').default;
}

declare module 'virtual:studiocms/components/DefaultEditor' {
	export const DefaultEditor: typeof import('./src/components/DefaultEditor.astro').default;
	export default DefaultEditor;
}

declare module 'studiocms:i18n' {
	export const staticPaths: typeof import('./static/i18n/index.js').staticPaths;
	export const getLangFromUrl: typeof import('./static/i18n/index.js').getLangFromUrl;
	export const useTranslations: typeof import('./static/i18n/index.js').useTranslations;
	export const useTranslatedPath: typeof import('./static/i18n/index.js').useTranslatedPath;
	export const languageSelectorOptions: typeof import(
		'./static/i18n/index.js'
	).languageSelectorOptions;
	export const getCurrentURLPath: typeof import('./static/i18n/index.js').getCurrentURLPath;
	export const switchLanguage: typeof import('./static/i18n/index.js').switchLanguage;
	export type UiLanguageKeys = import('./static/i18n/index.js').UiLanguageKeys;
	export type UiTranslations = import('./static/i18n/index.js').UiTranslations;
}

declare module 'studiocms:imageHandler/components' {
	export const CustomImage: typeof import('./src/components/image/CustomImage.astro').default;
}

declare module 'studiocms:lib' {
	export const HeadConfigSchema: typeof import('./src/lib/head.js').HeadConfigSchema;
	export const createHead: typeof import('./src/lib/head.js').createHead;
	export const headDefaults: typeof import('./src/lib/headDefaults.js').headDefaults;
	export const stringify: typeof import('./src/lib/jsonUtils.js').stringify;
	export const stringifyMap: typeof import('./src/lib/jsonUtils.js').stringifyMap;
	export const pathWithBase: typeof import('./src/lib/pathGenerators.js').pathWithBase;
	export const fileWithBase: typeof import('./src/lib/pathGenerators.js').fileWithBase;
	export const ensureLeadingSlash: typeof import('./src/lib/pathGenerators.js').ensureLeadingSlash;
	export const ensureTrailingSlash: typeof import(
		'./src/lib/pathGenerators.js'
	).ensureTrailingSlash;
	export const stripLeadingSlash: typeof import('./src/lib/pathGenerators.js').stripLeadingSlash;
	export const stripTrailingSlash: typeof import('./src/lib/pathGenerators.js').stripTrailingSlash;
	export const stripHtmlExtension: typeof import('./src/lib/pathGenerators.js').stripHtmlExtension;
	export const ensureHtmlExtension: typeof import(
		'./src/lib/pathGenerators.js'
	).ensureHtmlExtension;
	export const removeLeadingTrailingSlashes: typeof import(
		'./src/lib/removeLeadingTrailingSlashes.js'
	).removeLeadingTrailingSlashes;
	export const getSluggedRoute: typeof import('./src/lib/routeMap.js').getSluggedRoute;
	export const getEditRoute: typeof import('./src/lib/routeMap.js').getEditRoute;
	export const getDeleteRoute: typeof import('./src/lib/routeMap.js').getDeleteRoute;
	export const makeNonDashboardRoute: typeof import('./src/lib/routeMap.js').makeNonDashboardRoute;
	export const makeDashboardRoute: typeof import('./src/lib/routeMap.js').makeDashboardRoute;
	export const StudioCMSRoutes: typeof import('./src/lib/routeMap.js').StudioCMSRoutes;
	export const sideBarLinkMap: typeof import('./src/lib/routeMap.js').sideBarLinkMap;
	export const urlGenFactory: typeof import('./src/lib/urlGen.js').default;

	export type HeadConfig = import('./src/lib/head.js').HeadConfig;
	export type HeadUserConfig = import('./src/lib/head.js').HeadUserConfig;
}

declare module 'studiocms:plugins' {
	const mod: import('./src/plugins.js').SafePluginListType;
	export default mod;
}

declare module 'studiocms:plugin-helpers' {
	export type SettingsField = import('./src/plugins.js').SettingsField;
}

declare module 'studiocms:component-proxy' {
	export const componentKeys: string[];
}

declare module 'studiocms:sdk' {
	const mod: typeof import('./src/sdk/index.js').studioCMS_SDK;
	export default mod;
}

declare module 'studiocms:sdk/types' {
	export type AvailableLists = import('./src/sdk/types/index.js').AvailableLists;
	export type CombinedRank = import('./src/sdk/types/index.js').CombinedRank;
	export type DatabaseTables = import('./src/sdk/types/index.js').DatabaseTables;
	export type PageContentReturnId = import('./src/sdk/types/index.js').PageContentReturnId;
	export type PageDataCategoriesInsertResponse = import(
		'./src/sdk/types/index.js'
	).PageDataCategoriesInsertResponse;
	export type PageDataReturnId = import('./src/sdk/types/index.js').PageDataReturnId;
	export type PageDataStripped = import('./src/sdk/types/index.js').PageDataStripped;
	export type PageDataTagsInsertResponse = import(
		'./src/sdk/types/index.js'
	).PageDataTagsInsertResponse;
	export type SingleRank = import('./src/sdk/types/index.js').SingleRank;
	export type SiteConfig = import('./src/sdk/types/index.js').SiteConfig;

	export type tsDiffTrackingInsert = import('./src/sdk/types/index.js').tsDiffTrackingInsert;
	export type tsDiffTrackingSelect = import('./src/sdk/types/index.js').tsDiffTrackingSelect;
	export type CombinedInsertContent = import('./src/sdk/types/index.js').CombinedInsertContent;
	export type tsOAuthAccountsSelect = import('./src/sdk/types/index.js').tsOAuthAccountsSelect;
	export type tsPageContentInsert = import('./src/sdk/types/index.js').tsPageContentInsert;
	export type tsPageContentSelect = import('./src/sdk/types/index.js').tsPageContentSelect;
	export type tsPageDataCategoriesInsert = import(
		'./src/sdk/types/index.js'
	).tsPageDataCategoriesInsert;
	export type tsPageDataCategoriesSelect = import(
		'./src/sdk/types/index.js'
	).tsPageDataCategoriesSelect;
	export type tsPageDataInsert = import('./src/sdk/types/index.js').tsPageDataInsert;
	export type tsPageDataSelect = import('./src/sdk/types/index.js').tsPageDataSelect;
	export type tsPageDataTagsInsert = import('./src/sdk/types/index.js').tsPageDataTagsInsert;
	export type tsPageDataTagsSelect = import('./src/sdk/types/index.js').tsPageDataTagsSelect;
	export type tsSiteConfigInsert = import('./src/sdk/types/index.js').tsSiteConfigInsert;
	export type tsSiteConfigSelect = import('./src/sdk/types/index.js').tsSiteConfigSelect;
	export type tsUsersInsert = import('./src/sdk/types/index.js').tsUsersInsert;
	export type tsUsersSelect = import('./src/sdk/types/index.js').tsUsersSelect;
	export type tsUsersUpdate = import('./src/sdk/types/index.js').tsUsersUpdate;
	export type tsPermissionsInsert = import('./src/sdk/types/index.js').tsPermissionsInsert;
	export type tsPermissionsSelect = import('./src/sdk/types/index.js').tsPermissionsSelect;
	export type tsSessionTableInsert = import('./src/sdk/types/index.js').tsSessionTableInsert;
	export type tsSessionTableSelect = import('./src/sdk/types/index.js').tsSessionTableSelect;

	export type addDatabaseEntryInsertPage = import(
		'./src/sdk/types/index.js'
	).addDatabaseEntryInsertPage;
	export type CombinedUserData = import('./src/sdk/types/index.js').CombinedUserData;
	export type CombinedPageData = import('./src/sdk/types/index.js').CombinedPageData;
	export type DeletionResponse = import('./src/sdk/types/index.js').DeletionResponse;
}

declare module 'studiocms:sdk/cache' {
	const studioCMS_SDK_Cache: import('./src/sdk/types/index.js').STUDIOCMS_SDK_CACHE;
	export default studioCMS_SDK_Cache;

	export type STUDIOCMS_SDK_CACHE = import('./src/sdk/cache.js').STUDIOCMS_SDK_CACHE;
	export type PageDataCacheObject = import('./src/sdk/cache.js').PageDataCacheObject;
	export type SiteConfigCacheObject = import('./src/sdk/cache.js').SiteConfigCacheObject;
	export type VersionCacheObject = import('./src/sdk/cache.js').VersionCacheObject;
}
