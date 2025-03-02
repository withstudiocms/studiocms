declare module 'studiocms:logger' {
	export const logger: import('astro').AstroIntegrationLogger;
	export default logger;
}

declare module 'studiocms:components/dashboard-grid-items' {
	export const dashboardGridItems: import('./lib/dashboardGrid').GridItemUsable[];
	export default dashboardGridItems;
}

declare module 'studiocms:plugins/dashboard-pages/user' {
	const dashboardPages: import('./schemas/index').FinalDashboardPage[];
	export default dashboardPages;
}

declare module 'studiocms:plugins/dashboard-pages/admin' {
	const dashboardPages: import('./schemas/index').FinalDashboardPage[];
	export default dashboardPages;
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
	export const config: import('./schemas/index.js').StudioCMSConfig;
	export default config;

	export const dashboardConfig: import('./schemas/index.js').StudioCMSConfig['dashboardConfig'];
	export const AuthConfig: import(
		'./schemas/index.js'
	).StudioCMSConfig['dashboardConfig']['AuthConfig'];
	export const developerConfig: import(
		'./schemas/index.js'
	).StudioCMSConfig['dashboardConfig']['developerConfig'];
	export const defaultFrontEndConfig: import(
		'./schemas/index.js'
	).StudioCMSConfig['defaultFrontEndConfig'];
	export const sdk: import('./schemas/index.js').StudioCMSConfig['sdk'];
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
	export const FormattedDate: typeof import('./components/FormattedDate.astro').default;
	export const Generator: typeof import('./components/Generator.astro').default;
}

declare module 'virtual:studiocms/components/Editors' {
	export const editorKeys: string[];
}

declare module 'studiocms:i18n' {
	export const staticPaths: typeof import('./lib/i18n/index.js').staticPaths;
	export const getLangFromUrl: typeof import('./lib/i18n/index.js').getLangFromUrl;
	export const useTranslations: typeof import('./lib/i18n/index.js').useTranslations;
	export const useTranslatedPath: typeof import('./lib/i18n/index.js').useTranslatedPath;
	export const languageSelectorOptions: typeof import(
		'./lib/i18n/index.js'
	).languageSelectorOptions;
	export const getCurrentURLPath: typeof import('./lib/i18n/index.js').getCurrentURLPath;
	export const switchLanguage: typeof import('./lib/i18n/index.js').switchLanguage;
	export type UiLanguageKeys = import('./lib/i18n/index.js').UiLanguageKeys;
	export type UiTranslations = import('./lib/i18n/index.js').UiTranslations;
}

declare module 'studiocms:imageHandler/components' {
	export const CustomImage: typeof import('./components/image/CustomImage.astro').default;
}

declare module 'studiocms:lib' {
	export const HeadConfigSchema: typeof import('./lib/head.js').HeadConfigSchema;
	export const createHead: typeof import('./lib/head.js').createHead;
	export const headDefaults: typeof import('./lib/headDefaults.js').headDefaults;
	export const stringify: typeof import('./lib/jsonUtils.js').stringify;
	export const stringifyMap: typeof import('./lib/jsonUtils.js').stringifyMap;
	export const pathWithBase: typeof import('./lib/pathGenerators.js').pathWithBase;
	export const fileWithBase: typeof import('./lib/pathGenerators.js').fileWithBase;
	export const ensureLeadingSlash: typeof import('./lib/pathGenerators.js').ensureLeadingSlash;
	export const ensureTrailingSlash: typeof import('./lib/pathGenerators.js').ensureTrailingSlash;
	export const stripLeadingSlash: typeof import('./lib/pathGenerators.js').stripLeadingSlash;
	export const stripTrailingSlash: typeof import('./lib/pathGenerators.js').stripTrailingSlash;
	export const stripHtmlExtension: typeof import('./lib/pathGenerators.js').stripHtmlExtension;
	export const ensureHtmlExtension: typeof import('./lib/pathGenerators.js').ensureHtmlExtension;
	export const removeLeadingTrailingSlashes: typeof import(
		'./lib/removeLeadingTrailingSlashes.js'
	).removeLeadingTrailingSlashes;
	export const getSluggedRoute: typeof import('./lib/routeMap.js').getSluggedRoute;
	export const getEditRoute: typeof import('./lib/routeMap.js').getEditRoute;
	export const getDeleteRoute: typeof import('./lib/routeMap.js').getDeleteRoute;
	export const makeNonDashboardRoute: typeof import('./lib/routeMap.js').makeNonDashboardRoute;
	export const makeDashboardRoute: typeof import('./lib/routeMap.js').makeDashboardRoute;
	export const StudioCMSRoutes: typeof import('./lib/routeMap.js').StudioCMSRoutes;
	export const urlGenFactory: typeof import('./lib/urlGen.js').default;

	export type HeadConfig = import('./lib/head.js').HeadConfig;
	export type HeadUserConfig = import('./lib/head.js').HeadUserConfig;
}

declare module 'studiocms:plugins' {
	const mod: import('./plugins.js').SafePluginListType;
	export default mod;
}

declare module 'studiocms:plugin-helpers' {
	export type SettingsField = import('./plugins.js').SettingsField;
	export type SafePluginListType = import('./plugins.js').SafePluginListType;
	export type StudioCMSPlugin = import('./plugins.js').StudioCMSPlugin;
	export type StudioCMSPluginOptions = import('./plugins.js').StudioCMSPluginOptions;
	export type AvailableDashboardPages = import('./plugins.js').AvailableDashboardPages;
	export type FinalDashboardPage = import('./plugins.ts').FinalDashboardPage;
	export type DashboardPage = import('./plugins.js').DashboardPage;

	export const getPluginDashboardPages: typeof import(
		'./lib/plugins/index.js'
	).getPluginDashboardPages;
	export const frontendNavigation: typeof import('./lib/plugins/index.js').frontendNavigation;
}

declare module 'studiocms:component-proxy' {
	export const componentKeys: string[];
}

declare module 'studiocms:sdk' {
	const mod: typeof import('./sdk/index.js').studioCMS_SDK;
	export default mod;
}

declare module 'studiocms:sdk/types' {
	export type AvailableLists = import('./sdk/types/index.js').AvailableLists;
	export type CombinedRank = import('./sdk/types/index.js').CombinedRank;
	export type DatabaseTables = import('./sdk/types/index.js').DatabaseTables;
	export type PageContentReturnId = import('./sdk/types/index.js').PageContentReturnId;
	export type PageDataCategoriesInsertResponse = import(
		'./sdk/types/index.js'
	).PageDataCategoriesInsertResponse;
	export type PageDataReturnId = import('./sdk/types/index.js').PageDataReturnId;
	export type PageDataStripped = import('./sdk/types/index.js').PageDataStripped;
	export type PageDataTagsInsertResponse = import(
		'./sdk/types/index.js'
	).PageDataTagsInsertResponse;
	export type SingleRank = import('./sdk/types/index.js').SingleRank;
	export type SiteConfig = import('./sdk/types/index.js').SiteConfig;

	export type tsDiffTrackingInsert = import('./sdk/types/index.js').tsDiffTrackingInsert;
	export type tsDiffTrackingSelect = import('./sdk/types/index.js').tsDiffTrackingSelect;
	export type CombinedInsertContent = import('./sdk/types/index.js').CombinedInsertContent;
	export type tsOAuthAccountsSelect = import('./sdk/types/index.js').tsOAuthAccountsSelect;
	export type tsPageContentInsert = import('./sdk/types/index.js').tsPageContentInsert;
	export type tsPageContentSelect = import('./sdk/types/index.js').tsPageContentSelect;
	export type tsPageDataCategoriesInsert = import(
		'./sdk/types/index.js'
	).tsPageDataCategoriesInsert;
	export type tsPageDataCategoriesSelect = import(
		'./sdk/types/index.js'
	).tsPageDataCategoriesSelect;
	export type tsPageDataInsert = import('./sdk/types/index.js').tsPageDataInsert;
	export type tsPageDataSelect = import('./sdk/types/index.js').tsPageDataSelect;
	export type tsPageDataTagsInsert = import('./sdk/types/index.js').tsPageDataTagsInsert;
	export type tsPageDataTagsSelect = import('./sdk/types/index.js').tsPageDataTagsSelect;
	export type tsSiteConfigInsert = import('./sdk/types/index.js').tsSiteConfigInsert;
	export type tsSiteConfigSelect = import('./sdk/types/index.js').tsSiteConfigSelect;
	export type tsUsersInsert = import('./sdk/types/index.js').tsUsersInsert;
	export type tsUsersSelect = import('./sdk/types/index.js').tsUsersSelect;
	export type tsUsersUpdate = import('./sdk/types/index.js').tsUsersUpdate;
	export type tsPermissionsInsert = import('./sdk/types/index.js').tsPermissionsInsert;
	export type tsPermissionsSelect = import('./sdk/types/index.js').tsPermissionsSelect;
	export type tsSessionTableInsert = import('./sdk/types/index.js').tsSessionTableInsert;
	export type tsSessionTableSelect = import('./sdk/types/index.js').tsSessionTableSelect;

	export type addDatabaseEntryInsertPage = import(
		'./sdk/types/index.js'
	).addDatabaseEntryInsertPage;
	export type CombinedUserData = import('./sdk/types/index.js').CombinedUserData;
	export type CombinedPageData = import('./sdk/types/index.js').CombinedPageData;
	export type DeletionResponse = import('./sdk/types/index.js').DeletionResponse;
}

declare module 'studiocms:sdk/cache' {
	const studioCMS_SDK_Cache: import('./sdk/types/index.js').STUDIOCMS_SDK_CACHE;
	export default studioCMS_SDK_Cache;

	export type STUDIOCMS_SDK_CACHE = import('./sdk/cache.js').STUDIOCMS_SDK_CACHE;
	export type PageDataCacheObject = import('./sdk/cache.js').PageDataCacheObject;
	export type SiteConfigCacheObject = import('./sdk/cache.js').SiteConfigCacheObject;
	export type VersionCacheObject = import('./sdk/cache.js').VersionCacheObject;
}

declare module 'studiocms-dashboard:web-vitals' {
	export const getWebVitals: typeof import('./lib/webVitals/webVital').getWebVitals;
}
