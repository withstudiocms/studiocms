declare module 'studiocms:lib' {
	export const HeadConfigSchema: typeof import('studiocms/lib/head.js').HeadConfigSchema;
	export const createHead: typeof import('studiocms/lib/head.js').createHead;
	export const headDefaults: typeof import('studiocms/lib/headDefaults.js').headDefaults;
	export const stringify: typeof import('studiocms/lib/jsonUtils.js').stringify;
	export const stringifyMap: typeof import('studiocms/lib/jsonUtils.js').stringifyMap;
	export const pathWithBase: typeof import('studiocms/lib/pathGenerators.js').pathWithBase;
	export const fileWithBase: typeof import('studiocms/lib/pathGenerators.js').fileWithBase;
	export const ensureLeadingSlash: typeof import(
		'studiocms/lib/pathGenerators.js'
	).ensureLeadingSlash;
	export const ensureTrailingSlash: typeof import(
		'studiocms/lib/pathGenerators.js'
	).ensureTrailingSlash;
	export const stripLeadingSlash: typeof import(
		'studiocms/lib/pathGenerators.js'
	).stripLeadingSlash;
	export const stripTrailingSlash: typeof import(
		'studiocms/lib/pathGenerators.js'
	).stripTrailingSlash;
	export const stripHtmlExtension: typeof import(
		'studiocms/lib/pathGenerators.js'
	).stripHtmlExtension;
	export const ensureHtmlExtension: typeof import(
		'studiocms/lib/pathGenerators.js'
	).ensureHtmlExtension;
	export const removeLeadingTrailingSlashes: typeof import(
		'studiocms/lib/removeLeadingTrailingSlashes.js'
	).removeLeadingTrailingSlashes;
	export const getSluggedRoute: typeof import('studiocms/lib/routeMap.js').getSluggedRoute;
	export const getEditRoute: typeof import('studiocms/lib/routeMap.js').getEditRoute;
	export const getDeleteRoute: typeof import('studiocms/lib/routeMap.js').getDeleteRoute;
	export const makeNonDashboardRoute: typeof import(
		'studiocms/lib/routeMap.js'
	).makeNonDashboardRoute;
	export const makeDashboardRoute: typeof import('studiocms/lib/routeMap.js').makeDashboardRoute;
	export const StudioCMSRoutes: typeof import('studiocms/lib/routeMap.js').StudioCMSRoutes;
	export const sideBarLinkMap: typeof import('studiocms/lib/routeMap.js').sideBarLinkMap;
	export const urlGenFactory: typeof import('studiocms/lib/urlGen.js').default;

	export type HeadConfig = import('studiocms/lib/head.js').HeadConfig;
	export type HeadUserConfig = import('studiocms/lib/head.js').HeadUserConfig;
}

declare module 'studiocms:config' {
	export const config: import('studiocms/schemas').StudioCMSConfig;
	export default config;

	export const dashboardConfig: import(
		'studiocms/schemas'
	).StudioCMSConfig['features']['dashboardConfig'];
	/**
	 * @deprecated
	 */
	export const AuthConfig: import('studiocms/schemas').StudioCMSConfig['features']['authConfig'];
	export const authConfig: import('studiocms/schemas').StudioCMSConfig['features']['authConfig'];
	export const developerConfig: import(
		'studiocms/schemas'
	).StudioCMSConfig['features']['developerConfig'];
	export const sdk: import('studiocms/schemas').StudioCMSConfig['sdk'];
}

declare module 'studiocms:plugins' {
	const mod: import('studiocms/plugins').SafePluginListType;
	export default mod;
}

declare module 'studiocms:plugin-helpers' {
	export type SettingsField = import('studiocms/plugins').SettingsField;
	export type SafePluginListType = import('studiocms/plugins').SafePluginListType;
	export type StudioCMSPlugin = import('studiocms/plugins').StudioCMSPlugin;
	export type StudioCMSPluginOptions = import('studiocms/plugins').StudioCMSPluginOptions;
	export type AvailableDashboardPages = import('studiocms/plugins').AvailableDashboardPages;
	export type FinalDashboardPage = import('studiocms/plugins').FinalDashboardPage;
	export type DashboardPage = import('studiocms/plugins').DashboardPage;

	export const getPluginDashboardPages: typeof import(
		'studiocms/lib/plugins/index.js'
	).getPluginDashboardPages;
	export const frontendNavigation: typeof import(
		'studiocms/lib/plugins/index.js'
	).frontendNavigation;
}
