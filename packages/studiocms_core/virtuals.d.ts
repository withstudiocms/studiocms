declare module 'virtual:studiocms/pluginSystem' {
	/** @deprecated */
	export const externalNav: typeof import('./src/lib').externalNavigation;
	/** @deprecated */
	export const dashboardPageLinks: typeof import('./src/lib').dashboardPageLinksMap;
	/** @deprecated */
	export const pluginList: typeof import('./src/lib').studioCMSPluginList;
	/** @deprecated */
	export const customRenderers: string[];
}
declare module 'studiocms:helpers/contentHelper' {
	/** @deprecated */
	export const contentHelper: typeof import('./src/helpers').contentHelper;
	/** @deprecated */
	export const getSiteConfig: typeof import('./src/helpers').getSiteConfig;
	/** @deprecated */
	export const getPageList: typeof import('./src/helpers').getPageList;
	/** @deprecated */
	export const getUserList: typeof import('./src/helpers').getUserList;
	/** @deprecated */
	export const getUserById: typeof import('./src/helpers').getUserById;
	/** @deprecated */
	export type ContentHelperTempResponse = import('./src/helpers').ContentHelperTempResponse;
	/** @deprecated */
	export type SiteConfigResponse = import('./src/helpers').SiteConfigResponse;
	/** @deprecated */
	export type pageDataReponse = import('./src/helpers').pageDataReponse;
	/** @deprecated */
	export type UserResponse = import('./src/helpers').UserResponse;
}

/**
 * # DEV TIP
 *
 * Wanting to extend StudioCMS? You can do so by defining a new module in the `virtual:studiocms` namespace within your project with the following format:
 *
 * This module can also be declared from `studiocms`.
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
 * This module can also be declared from `@studiocms/core/components`.
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
 * This module can also be declared from `@studiocms/core/helpers`.
 * }
 */
declare module 'studiocms:helpers' {
	export const urlGenFactory: typeof import('./src/helpers').urlGenFactory;
	export const pathWithBase: typeof import('./src/helpers').pathWithBase;
	export const fileWithBase: typeof import('./src/helpers').fileWithBase;
}

/**
 * # DEV TIP
 *
 * Wanting to extend StudioCMS? You can do so by defining a new module in the `virtual:studiocms` namespace within your project with the following format:
 *
 * This module can also be declared from `@studiocms/core/helpers`.
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
 * This module can also be declared from `@studiocms/core/helpers`.
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

declare module 'studiocms:i18n' {
	export const staticPaths: typeof import('./src/i18n').staticPaths;
	export const getLangFromUrl: typeof import('./src/i18n').getLangFromUrl;
	export const useTranslations: typeof import('./src/i18n').useTranslations;
	export const useTranslatedPath: typeof import('./src/i18n').useTranslatedPath;
	export const languageSelectorOptions: typeof import('./src/i18n').languageSelectorOptions;
	export const getCurrentURLPath: typeof import('./src/i18n').getCurrentURLPath;
	export const switchLanguage: typeof import('./src/i18n').switchLanguage;
}

declare module 'studiocms:sdk' {
	export const studioCMS_SDK: import('./src/sdk-utils').STUDIOCMS_SDK;
}

declare module 'studiocms:sdk/get' {
	export const studioCMS_SDK_GET: import('./src/sdk-utils/get').default;
}

declare module 'studiocms:sdk/post' {
	export const studioCMS_SDK_POST: import('./src/sdk-utils/post').default;
}

declare module 'studiocms:sdk/update' {
	export const studioCMS_SDK_UPDATE: import('./src/sdk-utils/update').default;
}

declare module 'studiocms:sdk/delete' {
	export const studioCMS_SDK_DELETE: import('./src/sdk-utils/delete').default;
}

declare module 'studiocms:sdk/auth' {
	export const studioCMS_SDK_AUTH: import('./src/sdk-utils/auth').default;
}

declare module 'studiocms:sdk/types' {
	export type STUDIOCMS_SDK = import('./src/sdk-utils/types').STUDIOCMS_SDK;
}
