interface ImportMetaEnv {
	readonly PROD: boolean;
	readonly BASE_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module 'studiocms:renderer/current' {
	const defaultExport: typeof import('../studiocms_renderers/dist/lib/contentRenderer.ts').default;
	export default defaultExport;
	export const contentRenderer: typeof import(
		'../studiocms_renderers/dist/lib/contentRenderer.ts'
	).contentRenderer;
}
declare module 'studiocms:lib' {
	export const HeadConfigSchema: typeof import(
		'../studiocms_core/src/lib/head.ts'
	).HeadConfigSchema;
	export const createHead: typeof import('../studiocms_core/src/lib/head.ts').createHead;
	export const headDefaults: typeof import(
		'../studiocms_core/src/lib/headDefaults.ts'
	).headDefaults;
	export const stringify: typeof import('../studiocms_core/src/lib/jsonUtils.ts').stringify;
	export const stringifyMap: typeof import('../studiocms_core/src/lib/jsonUtils.ts').stringifyMap;
	export const pathWithBase: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).pathWithBase;
	export const fileWithBase: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).fileWithBase;
	export const ensureLeadingSlash: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).ensureLeadingSlash;
	export const ensureTrailingSlash: typeof import(
		'../packages/studiocms_core/src/lib/pathGenerators.ts'
	).ensureTrailingSlash;
	export const ensureLeadingSlashAndTrailingSlash: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).ensureLeadingSlashAndTrailingSlash;
	export const stripLeadingSlash: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).stripLeadingSlash;
	export const stripTrailingSlash: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).stripTrailingSlash;
	export const stripLeadingSlashAndTrailingSlash: typeof import(
		'../packages/studiocms_core/src/lib/pathGenerators.ts'
	).stripLeadingSlashAndTrailingSlash;
	export const stripHtmlExtension: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).stripHtmlExtension;
	export const ensureHtmlExtension: typeof import(
		'../studiocms_core/src/lib/pathGenerators.ts'
	).ensureHtmlExtension;
	export const removeLeadingTrailingSlashes: typeof import(
		'../studiocms_core/src/lib/removeLeadingTrailingSlashes.ts'
	).removeLeadingTrailingSlashes;
	export const getSluggedRoute: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).getSluggedRoute;
	export const getEditRoute: typeof import('../studiocms_core/src/lib/routeMap.ts').getEditRoute;
	export const getDeleteRoute: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).getDeleteRoute;
	export const makeNonDashboardRoute: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).makeNonDashboardRoute;
	export const makeDashboardRoute: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).makeDashboardRoute;
	export const StudioCMSRoutes: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).StudioCMSRoutes;
	export const sideBarLinkMap: typeof import(
		'../studiocms_core/src/lib/routeMap.ts'
	).sideBarLinkMap;
	export const urlGenFactory: typeof import('../studiocms_core/src/lib/urlGen.ts').urlGenFactory;
	export type HeadConfig = import('../studiocms_core/src/lib/head.ts').HeadConfig;
	export type HeadUserConfig = import('../studiocms_core/src/lib/head.ts').HeadUserConfig;
}

declare module 'studiocms:version' {
	const defaultExport: string;
	export default defaultExport;
}

declare module 'studiocms:components' {
	/**
	 * # Avatar Component used for the Navigation Component
	 *
	 * This component has no props and will render the current user avatar or a default avatar if no user is logged in based on the Astro.locals object
	 */
	export const Avatar: typeof import('../studiocms_core/src/components/Avatar.astro').default;
	/**
	 * # Formatted Date Component used for rendering dates in a human readable format
	 *
	 * This components locale will adapt to the current configuration of the StudioCMS 'dateLocale' settings configuration option.
	 *
	 * @props {string(Date)} date - Date String
	 */
	export const FormattedDate: typeof import(
		'../studiocms_core/src/components/FormattedDate.astro'
	).default;
	/**
	 * # Generic Header Component <GenericHeader />
	 *
	 * Generic Header Component used for rendering a generic header with a title and description from StudioCMS
	 */
	export const GenericHeader: typeof import(
		'../studiocms_core/src/components/GenericHeader.astro'
	).default;
	/**
	 * # Navigation Component used for rendering StudioCMS User Facing Navigation
	 *
	 * This component is a helper component that will render the StudioCMS user facing navigation to assist in easy navigation of your built front-end site
	 *
	 * @props {topLevelLinkCount} number - Number of top level links to display before collapsing into a dropdown
	 * @props {hideAvatar} boolean - Hide the user avatar/Login button in the navigation bar
	 */
	export const Navigation: typeof import(
		'../studiocms_core/src/components/Navigation.astro'
	).default;
	/**
	 * Component used for the generator meta tag
	 *
	 * Useful for providing the current version of the StudioCMS package in the meta tags of your site
	 */
	export const Generator: typeof import('../studiocms_core/src/components/Generator.astro').default;
}

declare module 'studiocms:config' {
	const defaultExport: import('../studiocms_core/src/schemas/config/index.ts').StudioCMSConfig;
	export default defaultExport;
	export const config: import('../studiocms_core/src/schemas/config/index.ts').StudioCMSConfig;
	export const dashboardConfig: import(
		'../studiocms_core/src/schemas/config/index.ts'
	).StudioCMSConfig['dashboardConfig'];
	export const AuthConfig: import(
		'../studiocms_core/src/schemas/config/index.ts'
	).StudioCMSConfig['dashboardConfig']['AuthConfig'];
	export const developerConfig: import(
		'../studiocms_core/src/schemas/config/index.ts'
	).StudioCMSConfig['dashboardConfig']['developerConfig'];
	export const defaultFrontEndConfig: import(
		'../studiocms_core/src/schemas/config/index.ts'
	).StudioCMSConfig['defaultFrontEndConfig'];
	export const sdk: import('../studiocms_core/src/schemas/config/index.ts').StudioCMSConfig['sdk'];
}

declare module 'studiocms:renderer' {
	export const StudioCMSRenderer: typeof import(
		'../studiocms_renderers/components/Renderer'
	).default;
}
// This file is generated by StudioCMS and should not be modified manually.

declare module 'studiocms:sdk' {
	const defaultExport: typeof import('./src/sdk-utils/index.ts').default;
	export default defaultExport;
}

declare module 'studiocms:sdk/get' {
	const defaultExport: typeof import('./src/sdk-utils/get/index.ts').default;
	export default defaultExport;
}

declare module 'studiocms:sdk/post' {
	const defaultExport: typeof import('./src/sdk-utils/post/index.ts').default;
	export default defaultExport;
}

declare module 'studiocms:sdk/update' {
	const defaultExport: typeof import('./src/sdk-utils/update/index.ts').default;
	export default defaultExport;
}

declare module 'studiocms:sdk/delete' {
	const defaultExport: typeof import('./src/sdk-utils/delete/index.ts').default;
	export default defaultExport;
}

declare module 'studiocms:sdk/auth' {
	const defaultExport: typeof import('./src/sdk-utils/auth/index.ts').default;
	export default defaultExport;
}

declare module 'studiocms:sdk/types' {
	export type STUDIOCMS_SDK = import('./src/sdk-utils/types/index.ts').STUDIOCMS_SDK;
	export type AvailableLists = import('./src/sdk-utils/types/index.ts').AvailableLists;
	export type CombinedRank = import('./src/sdk-utils/types/index.ts').CombinedRank;
	export type DatabaseTables = import('./src/sdk-utils/types/index.ts').DatabaseTables;
	export type PageContentReturnId = import('./src/sdk-utils/types/index.ts').PageContentReturnId;
	export type PageDataCategoriesInsertResponse = import(
		'./src/sdk-utils/types/index.ts'
	).PageDataCategoriesInsertResponse;
	export type PageDataReturnId = import('./src/sdk-utils/types/index.ts').PageDataReturnId;
	export type PageDataStripped = import('./src/sdk-utils/types/index.ts').PageDataStripped;
	export type PageDataTagsInsertResponse = import(
		'./src/sdk-utils/types/index.ts'
	).PageDataTagsInsertResponse;
	export type SingleRank = import('./src/sdk-utils/types/index.ts').SingleRank;
	export type SiteConfig = import('./src/sdk-utils/types/index.ts').SiteConfig;
	export type tsDiffTrackingInsert = import('./src/sdk-utils/types/index.ts').tsDiffTrackingInsert;
	export type tsDiffTrackingSelect = import('./src/sdk-utils/types/index.ts').tsDiffTrackingSelect;
	export type CombinedInsertContent = import(
		'./src/sdk-utils/types/index.ts'
	).CombinedInsertContent;
	export type tsOAuthAccountsSelect = import(
		'./src/sdk-utils/types/index.ts'
	).tsOAuthAccountsSelect;
	export type tsPageContentInsert = import('./src/sdk-utils/types/index.ts').tsPageContentInsert;
	export type tsPageContentSelect = import('./src/sdk-utils/types/index.ts').tsPageContentSelect;
	export type tsPageDataCategoriesInsert = import(
		'./src/sdk-utils/types/index.ts'
	).tsPageDataCategoriesInsert;
	export type tsPageDataCategoriesSelect = import(
		'./src/sdk-utils/types/index.ts'
	).tsPageDataCategoriesSelect;
	export type tsPageDataInsert = import('./src/sdk-utils/types/index.ts').tsPageDataInsert;
	export type tsPageDataSelect = import('./src/sdk-utils/types/index.ts').tsPageDataSelect;
	export type tsPageDataTagsInsert = import('./src/sdk-utils/types/index.ts').tsPageDataTagsInsert;
	export type tsPageDataTagsSelect = import('./src/sdk-utils/types/index.ts').tsPageDataTagsSelect;
	export type tsSiteConfigInsert = import('./src/sdk-utils/types/index.ts').tsSiteConfigInsert;
	export type tsSiteConfigSelect = import('./src/sdk-utils/types/index.ts').tsSiteConfigSelect;
	export type tsUsersInsert = import('./src/sdk-utils/types/index.ts').tsUsersInsert;
	export type tsUsersSelect = import('./src/sdk-utils/types/index.ts').tsUsersSelect;
	export type tsUsersUpdate = import('./src/sdk-utils/types/index.ts').tsUsersUpdate;
	export type tsPermissionsInsert = import('./src/sdk-utils/types/index.ts').tsPermissionsInsert;
	export type tsPermissionsSelect = import('./src/sdk-utils/types/index.ts').tsPermissionsSelect;
	export type tsSessionTableInsert = import('./src/sdk-utils/types/index.ts').tsSessionTableInsert;
	export type tsSessionTableSelect = import('./src/sdk-utils/types/index.ts').tsSessionTableSelect;
	export type GenericTable = import('./src/sdk-utils/types/index.ts').GenericTable;
	export type addDatabaseEntryInsertPage = import(
		'./src/sdk-utils/types/index.ts'
	).addDatabaseEntryInsertPage;
	export type CombinedUserData = import('./src/sdk-utils/types/index.ts').CombinedUserData;
	export type CombinedPageData = import('./src/sdk-utils/types/index.ts').CombinedPageData;
	export type DeletionResponse = import('./src/sdk-utils/types/index.ts').DeletionResponse;
}

declare module 'studiocms:sdk/cache' {
	const defaultExport: STUDIOCMS_SDK_CACHE;
	export default defaultExport;
	export const studioCMS_SDK_Cache: STUDIOCMS_SDK_CACHE;
	export type STUDIOCMS_SDK_CACHE = import('./src/sdk-utils/cache.ts').STUDIOCMS_SDK_CACHE;
	export type PageDataCacheObject = import('./src/sdk-utils/cache.ts').PageDataCacheObject;
	export type SiteConfigCacheObject = import('./src/sdk-utils/cache.ts').SiteConfigCacheObject;
	export type VersionCacheObject = import('./src/sdk-utils/cache.ts').VersionCacheObject;
}
