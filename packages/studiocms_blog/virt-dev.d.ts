interface ImportMetaEnv {
	readonly PROD: boolean;
	readonly BASE_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module 'studiocms:components' {
	export const Avatar: typeof import('@studiocms/core/components').Avatar;
	export const FormattedDate: typeof import('@studiocms/core/components').FormattedDate;
	export const Genericheader: typeof import('@studiocms/core/components').GenericHeader;
	export const Navigation: typeof import('@studiocms/core/components').Navigation;
}

declare module 'studiocms:helpers' {
	export const authHelper: typeof import('@studiocms/core/helpers').authHelper;
	export const urlGenFactory: typeof import('@studiocms/core/helpers').urlGenFactory;
	export const pathWithBase: typeof import('@studiocms/core/helpers').pathWithBase;
	export const fileWithBase: typeof import('@studiocms/core/helpers').fileWithBase;
}

declare module 'studiocms:helpers/contentHelper' {
	export const contentHelper: typeof import('@studiocms/core/helpers').contentHelper;
	export const getSiteConfig: typeof import('@studiocms/core/helpers').getSiteConfig;
	export const getPageList: typeof import('@studiocms/core/helpers').getPageList;
	export const getUserList: typeof import('@studiocms/core/helpers').getUserList;
	export const getUserById: typeof import('@studiocms/core/helpers').getUserById;
	export type ContentHelperTempResponse = import(
		'@studiocms/core/helpers'
	).ContentHelperTempResponse;
	export type SiteConfigResponse = import('@studiocms/core/helpers').SiteConfigResponse;
	export type pageDataReponse = import('@studiocms/core/helpers').pageDataReponse;
	export type UserResponse = import('@studiocms/core/helpers').UserResponse;
}

declare module 'studiocms:helpers/headDefaults' {
	export const headDefaults: typeof import('@studiocms/core/helpers').headDefaults;
}

declare module 'studiocms:helpers/routemap' {
	export const getSluggedRoute: typeof import('@studiocms/core/helpers').getSluggedRoute;
	export const getEditRoute: typeof import('@studiocms/core/helpers').getEditRoute;
	export const getDeleteRoute: typeof import('@studiocms/core/helpers').getDeleteRoute;
	export const makeNonDashboardRoute: typeof import(
		'@studiocms/core/helpers'
	).makeNonDashboardRoute;
	export const makeDashboardRoute: typeof import('@studiocms/core/helpers').makeDashboardRoute;
	export const makeAPIDashboardRoute: typeof import(
		'@studiocms/core/helpers'
	).makeAPIDashboardRoute;
	export const StudioCMSRoutes: typeof import('@studiocms/core/helpers').StudioCMSRoutes;
	export const sideBarLinkMap: typeof import('@studiocms/core/helpers').sideBarLinkMap;
}
