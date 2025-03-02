declare module 'astro:env/server' {
	export function getSecret(secret: string): string;
}

declare module 'virtual:studiocms/sitemaps' {
	export const sitemaps: string[];
}

declare module 'studiocms:logger' {
	export const logger: import('astro').AstroIntegrationLogger;
	export default logger;
}

declare module 'studiocms:components/dashboard-grid-items' {
	export const dashboardGridItems: import('./dist/lib/dashboardGrid').GridItemUsable[];
	export default dashboardGridItems;
}

declare module 'studiocms:plugins/dashboard-pages/user' {
	const dashboardPages: import('./dist/schemas/index').FinalDashboardPage[];
	export default dashboardPages;
}

declare module 'studiocms:plugins/dashboard-pages/admin' {
	const dashboardPages: import('./dist/schemas/index').FinalDashboardPage[];
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
	export const config: import('./dist/schemas/index.js').StudioCMSConfig;
	export default config;

	export const dashboardConfig: import(
		'./dist/schemas/index.js'
	).StudioCMSConfig['dashboardConfig'];
	export const AuthConfig: import(
		'./dist/schemas/index.js'
	).StudioCMSConfig['dashboardConfig']['AuthConfig'];
	export const developerConfig: import(
		'./dist/schemas/index.js'
	).StudioCMSConfig['dashboardConfig']['developerConfig'];
	export const defaultFrontEndConfig: import(
		'./dist/schemas/index.js'
	).StudioCMSConfig['defaultFrontEndConfig'];
	export const sdk: import('./dist/schemas/index.js').StudioCMSConfig['sdk'];
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
	export const FormattedDate: typeof import('./dist/components/FormattedDate.astro').default;
	export const Generator: typeof import('./dist/components/Generator.astro').default;
}

declare module 'virtual:studiocms/components/Editors' {
	export const editorKeys: string[];
}

declare module 'studiocms:i18n' {
	export const staticPaths: typeof import('./dist/lib/i18n/index.js').staticPaths;
	export const getLangFromUrl: typeof import('./dist/lib/i18n/index.js').getLangFromUrl;
	export const useTranslations: typeof import('./dist/lib/i18n/index.js').useTranslations;
	export const useTranslatedPath: typeof import('./dist/lib/i18n/index.js').useTranslatedPath;
	export const languageSelectorOptions: typeof import(
		'./dist/lib/i18n/index.js'
	).languageSelectorOptions;
	export const getCurrentURLPath: typeof import('./dist/lib/i18n/index.js').getCurrentURLPath;
	export const switchLanguage: typeof import('./dist/lib/i18n/index.js').switchLanguage;
	export type UiLanguageKeys = import('./dist/lib/i18n/index.js').UiLanguageKeys;
	export type UiTranslations = import('./dist/lib/i18n/index.js').UiTranslations;
}

declare module 'studiocms:imageHandler/components' {
	export const CustomImage: typeof import('./dist/components/image/CustomImage.astro').default;
}

declare module 'studiocms:lib' {
	export const HeadConfigSchema: typeof import('./dist/lib/head.js').HeadConfigSchema;
	export const createHead: typeof import('./dist/lib/head.js').createHead;
	export const headDefaults: typeof import('./dist/lib/headDefaults.js').headDefaults;
	export const stringify: typeof import('./dist/lib/jsonUtils.js').stringify;
	export const stringifyMap: typeof import('./dist/lib/jsonUtils.js').stringifyMap;
	export const pathWithBase: typeof import('./dist/lib/pathGenerators.js').pathWithBase;
	export const fileWithBase: typeof import('./dist/lib/pathGenerators.js').fileWithBase;
	export const ensureLeadingSlash: typeof import('./dist/lib/pathGenerators.js').ensureLeadingSlash;
	export const ensureTrailingSlash: typeof import(
		'./dist/lib/pathGenerators.js'
	).ensureTrailingSlash;
	export const stripLeadingSlash: typeof import('./dist/lib/pathGenerators.js').stripLeadingSlash;
	export const stripTrailingSlash: typeof import('./dist/lib/pathGenerators.js').stripTrailingSlash;
	export const stripHtmlExtension: typeof import('./dist/lib/pathGenerators.js').stripHtmlExtension;
	export const ensureHtmlExtension: typeof import(
		'./dist/lib/pathGenerators.js'
	).ensureHtmlExtension;
	export const removeLeadingTrailingSlashes: typeof import(
		'./dist/lib/removeLeadingTrailingSlashes.js'
	).removeLeadingTrailingSlashes;
	export const getSluggedRoute: typeof import('./dist/lib/routeMap.js').getSluggedRoute;
	export const getEditRoute: typeof import('./dist/lib/routeMap.js').getEditRoute;
	export const getDeleteRoute: typeof import('./dist/lib/routeMap.js').getDeleteRoute;
	export const makeNonDashboardRoute: typeof import('./dist/lib/routeMap.js').makeNonDashboardRoute;
	export const makeDashboardRoute: typeof import('./dist/lib/routeMap.js').makeDashboardRoute;
	export const StudioCMSRoutes: typeof import('./dist/lib/routeMap.js').StudioCMSRoutes;
	export const urlGenFactory: typeof import('./dist/lib/urlGen.js').default;

	export type HeadConfig = import('./dist/lib/head.js').HeadConfig;
	export type HeadUserConfig = import('./dist/lib/head.js').HeadUserConfig;
}

declare module 'studiocms:plugins' {
	const mod: import('./dist/plugins.js').SafePluginListType;
	export default mod;
}

declare module 'studiocms:plugin-helpers' {
	export type SettingsField = import('./dist/plugins.js').SettingsField;
	export type SafePluginListType = import('./dist/plugins.js').SafePluginListType;
	export type StudioCMSPlugin = import('./dist/plugins.js').StudioCMSPlugin;
	export type StudioCMSPluginOptions = import('./dist/plugins.js').StudioCMSPluginOptions;
	export type AvailableDashboardPages = import('./dist/plugins.js').AvailableDashboardPages;
	export type FinalDashboardPage = import('./dist/plugins.ts').FinalDashboardPage;
	export type DashboardPage = import('./dist/plugins.js').DashboardPage;

	export const getPluginDashboardPages: typeof import(
		'./dist/lib/plugins/index.js'
	).getPluginDashboardPages;
	export const frontendNavigation: typeof import('./dist/lib/plugins/index.js').frontendNavigation;
}

declare module 'studiocms:component-proxy' {
	export const componentKeys: string[];
}

declare module 'studiocms:sdk' {
	const mod: typeof import('./dist/sdk/index.js').studioCMS_SDK;
	export default mod;
}

declare module 'studiocms:sdk/types' {
	export type AvailableLists = import('./dist/sdk/types/index.js').AvailableLists;
	export type CombinedRank = import('./dist/sdk/types/index.js').CombinedRank;
	export type DatabaseTables = import('./dist/sdk/types/index.js').DatabaseTables;
	export type PageContentReturnId = import('./dist/sdk/types/index.js').PageContentReturnId;
	export type PageDataCategoriesInsertResponse = import(
		'./dist/sdk/types/index.js'
	).PageDataCategoriesInsertResponse;
	export type PageDataReturnId = import('./dist/sdk/types/index.js').PageDataReturnId;
	export type PageDataStripped = import('./dist/sdk/types/index.js').PageDataStripped;
	export type PageDataTagsInsertResponse = import(
		'./dist/sdk/types/index.js'
	).PageDataTagsInsertResponse;
	export type SingleRank = import('./dist/sdk/types/index.js').SingleRank;
	export type SiteConfig = import('./dist/sdk/types/index.js').SiteConfig;

	export type tsDiffTrackingInsert = import('./dist/sdk/types/index.js').tsDiffTrackingInsert;
	export type tsDiffTrackingSelect = import('./dist/sdk/types/index.js').tsDiffTrackingSelect;
	export type CombinedInsertContent = import('./dist/sdk/types/index.js').CombinedInsertContent;
	export type tsOAuthAccountsSelect = import('./dist/sdk/types/index.js').tsOAuthAccountsSelect;
	export type tsPageContentInsert = import('./dist/sdk/types/index.js').tsPageContentInsert;
	export type tsPageContentSelect = import('./dist/sdk/types/index.js').tsPageContentSelect;
	export type tsPageDataCategoriesInsert = import(
		'./dist/sdk/types/index.js'
	).tsPageDataCategoriesInsert;
	export type tsPageDataCategoriesSelect = import(
		'./dist/sdk/types/index.js'
	).tsPageDataCategoriesSelect;
	export type tsPageDataInsert = import('./dist/sdk/types/index.js').tsPageDataInsert;
	export type tsPageDataSelect = import('./dist/sdk/types/index.js').tsPageDataSelect;
	export type tsPageDataTagsInsert = import('./dist/sdk/types/index.js').tsPageDataTagsInsert;
	export type tsPageDataTagsSelect = import('./dist/sdk/types/index.js').tsPageDataTagsSelect;
	export type tsSiteConfigInsert = import('./dist/sdk/types/index.js').tsSiteConfigInsert;
	export type tsSiteConfigSelect = import('./dist/sdk/types/index.js').tsSiteConfigSelect;
	export type tsUsersInsert = import('./dist/sdk/types/index.js').tsUsersInsert;
	export type tsUsersSelect = import('./dist/sdk/types/index.js').tsUsersSelect;
	export type tsUsersUpdate = import('./dist/sdk/types/index.js').tsUsersUpdate;
	export type tsPermissionsInsert = import('./dist/sdk/types/index.js').tsPermissionsInsert;
	export type tsPermissionsSelect = import('./dist/sdk/types/index.js').tsPermissionsSelect;
	export type tsSessionTableInsert = import('./dist/sdk/types/index.js').tsSessionTableInsert;
	export type tsSessionTableSelect = import('./dist/sdk/types/index.js').tsSessionTableSelect;

	export type addDatabaseEntryInsertPage = import(
		'./dist/sdk/types/index.js'
	).addDatabaseEntryInsertPage;
	export type CombinedUserData = import('./dist/sdk/types/index.js').CombinedUserData;
	export type CombinedPageData = import('./dist/sdk/types/index.js').CombinedPageData;
	export type DeletionResponse = import('./dist/sdk/types/index.js').DeletionResponse;
}

declare module 'studiocms:sdk/cache' {
	const studioCMS_SDK_Cache: import('./dist/sdk/types/index.js').STUDIOCMS_SDK_CACHE;
	export default studioCMS_SDK_Cache;

	export type STUDIOCMS_SDK_CACHE = import('./dist/sdk/cache.js').STUDIOCMS_SDK_CACHE;
	export type PageDataCacheObject = import('./dist/sdk/cache.js').PageDataCacheObject;
	export type SiteConfigCacheObject = import('./dist/sdk/cache.js').SiteConfigCacheObject;
	export type VersionCacheObject = import('./dist/sdk/cache.js').VersionCacheObject;
}

declare module 'studiocms-dashboard:web-vitals' {
	export const getWebVitals: typeof import('./dist/lib/webVitals/webVital').getWebVitals;
}
