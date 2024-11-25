/**
 * # DEV TIP
 *
 * Wanting to extend StudioCMS? You can do so by defining a new module in the `virtual:studiocms` namespace within your project with the following format:
 *
 * This module can also be delcared from `studiocms`.
 *
 * @example
 * declare module 'virtual:studiocms/config' {
 * const Config: import('@studiocms/core/schemas').StudioCMSConfig;
 * export default Config;
 * }
 */
declare module 'virtual:studiocms/config' {
	const Config: import('./src/schemas').StudioCMSConfig;
	export default Config;
}

declare module 'virtual:studiocms/version' {
	const Version: string;
	export default Version;
}

declare module 'virtual:studiocms/astromdremarkConfig' {
	const markdownConfig: import('astro').AstroConfig['markdown'];
	export default markdownConfig;
}

/**
 * # DEV TIP
 *
 * Wanting to extend StudioCMS? You can do so by defining a new module in the `virtual:studiocms` namespace within your project with the following format:
 *
 * This module can also be delcared from `@studiocms/core/lib`.
 *
 */
declare module 'virtual:studiocms/pluginSystem' {
	export const externalNav: typeof import('./src/lib').externalNavigation;
	export const dashboardPageLinks: typeof import('./src/lib').dashboardPageLinksMap;
	export const pluginList: typeof import('./src/lib').studioCMSPluginList;
	export const customRenderers: string[];
}

/**
 * # DEV TIP
 *
 * Wanting to extend StudioCMS? You can do so by defining a new module in the `virtual:studiocms` namespace within your project with the following format:
 *
 * This module can also be delcared from `@studiocms/core/components`.
 * }
 */
declare module 'studiocms:components' {
	export const Avatar: typeof import('./src/components').Avatar;
	export const FormattedDate: typeof import('./src/components').FormattedDate;
	export const Genericheader: typeof import('./src/components').GenericHeader;
	export const Navigation: typeof import('./src/components').Navigation;
}

/**
 * # DEV TIP
 *
 * Wanting to extend StudioCMS? You can do so by defining a new module in the `virtual:studiocms` namespace within your project with the following format:
 *
 * This module can also be delcared from `@studiocms/core/helpers`.
 * }
 */
declare module 'studiocms:helpers' {
	export const authHelper: typeof import('./src/helpers').authHelper;
	export const urlGenFactory: typeof import('./src/helpers').urlGenFactory;
	export const pathWithBase: typeof import('./src/helpers').pathWithBase;
	export const fileWithBase: typeof import('./src/helpers').fileWithBase;
}

/**
 * # DEV TIP
 *
 * Wanting to extend StudioCMS? You can do so by defining a new module in the `virtual:studiocms` namespace within your project with the following format:
 *
 * This module can also be delcared from `@studiocms/core/helpers`.
 * }
 */
declare module 'studiocms:helpers/contentHelper' {
	export const contentHelper: typeof import('./src/helpers').contentHelper;
	export const getSiteConfig: typeof import('./src/helpers').getSiteConfig;
	export const getPageList: typeof import('./src/helpers').getPageList;
	export const getUserList: typeof import('./src/helpers').getUserList;
	export const getUserById: typeof import('./src/helpers').getUserById;
	export type ContentHelperTempResponse = import('./src/helpers').ContentHelperTempResponse;
	export type SiteConfigResponse = import('./src/helpers').SiteConfigResponse;
	export type pageDataReponse = import('./src/helpers').pageDataReponse;
	export type UserResponse = import('./src/helpers').UserResponse;
}

/**
 * # DEV TIP
 *
 * Wanting to extend StudioCMS? You can do so by defining a new module in the `virtual:studiocms` namespace within your project with the following format:
 *
 * This module can also be delcared from `@studiocms/core/helpers`.
 * }
 */
declare module 'studiocms:helpers/headDefaults' {
	export const headDefaults: typeof import('./src/helpers').headDefaults;
}

/**
 * # DEV TIP
 *
 * Wanting to extend StudioCMS? You can do so by defining a new module in the `virtual:studiocms` namespace within your project with the following format:
 *
 * This module can also be delcared from `@studiocms/core/helpers`.
 * }
 */
declare module 'studiocms:helpers/routemap' {
	export const getSluggedRoute: typeof import('./src/helpers').getSluggedRoute;
	export const getEditRoute: typeof import('./src/helpers').getEditRoute;
	export const getDeleteRoute: typeof import('./src/helpers').getDeleteRoute;
	export const makeNonDashboardRoute: typeof import('./src/helpers').makeNonDashboardRoute;
	export const makeDashboardRoute: typeof import('./src/helpers').makeDashboardRoute;
	export const makeAPIDashboardRoute: typeof import('./src/helpers').makeAPIDashboardRoute;
	export const StudioCMSRoutes: typeof import('./src/helpers').StudioCMSRoutes;
	export const sideBarLinkMap: typeof import('./src/helpers').sideBarLinkMap;
}
