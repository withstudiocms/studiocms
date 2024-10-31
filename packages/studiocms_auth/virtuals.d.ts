declare module 'studiocms:auth/lib/encryption' {
	export const encrypt: typeof import('./src/lib/encryption').encrypt;
	export const encryptString: typeof import('./src/lib/encryption').encryptString;
	export const decrypt: typeof import('./src/lib/encryption').decrypt;
	export const decryptToString: typeof import('./src/lib/encryption').decryptToString;
}

declare module 'studiocms:auth/lib/password' {
	export const hashPassword: typeof import('./src/lib/password').hashPassword;
	export const verifyPasswordHash: typeof import('./src/lib/password').verifyPasswordHash;
	export const verifyPasswordStrength: typeof import('./src/lib/password').verifyPasswordStrength;
}

declare module 'studiocms:auth/lib/session' {
	export const generateSessionToken: typeof import('./src/lib/session').generateSessionToken;
	export const sessionCookieName: typeof import('./src/lib/session').sessionCookieName;
	export const createSession: typeof import('./src/lib/session').createSession;
	export const validateSessionToken: typeof import('./src/lib/session').validateSessionToken;
	export const invalidateSession: typeof import('./src/lib/session').invalidateSession;
	export const setSessionTokenCookie: typeof import('./src/lib/session').setSessionTokenCookie;
	export const deleteSessionTokenCookie: typeof import('./src/lib/session').deleteSessionTokenCookie;
	export const setOAuthSessionTokenCookie: typeof import('./src/lib/session').setOAuthSessionTokenCookie;
	export const makeExpirationDate: typeof import('./src/lib/session').makeExpirationDate;
	export const sessionExpTime: typeof import('./src/lib/session').sessionExpTime;
}

declare module 'studiocms:auth/lib/types' {
	export type UserTable = import('./src/lib/types').UserTable;
	export type SessionTable = import('./src/lib/types').SessionTable;
	export type OAuthAccountsTable = import('./src/lib/types').OAuthAccountsTable;
	export type PermissionsTable = import('./src/lib/types').PermissionsTable;
	export type UserSessionData = import('./src/lib/types').UserSessionData;
	export type UserSession = import('./src/lib/types').UserSession;
	export type SessionValidationResult = import('./src/lib/types').SessionValidationResult;
}

declare module 'studiocms:auth/lib/user' {
	export const verifyUsernameInput: typeof import('./src/lib/user').verifyUsernameInput;
	export const createUserAvatar: typeof import('./src/lib/user').createUserAvatar;
	export const createLocalUser: typeof import('./src/lib/user').createLocalUser;
	export const updateUserPassword: typeof import('./src/lib/user').updateUserPassword;
	export const getUserPasswordHash: typeof import('./src/lib/user').getUserPasswordHash;
	export const getUserFromEmail: typeof import('./src/lib/user').getUserFromEmail;
	export const getUserData: typeof import('./src/lib/user').getUserData;
	export const permissionRanksMap: typeof import('./src/lib/user').permissionRanksMap;
	export const verifyUserPermissionLevel: typeof import('./src/lib/user').verifyUserPermissionLevel;
}

declare module 'studiocms:auth/utils/authEnvCheck' {
	export const authEnvCheck: typeof import('./src/utils/authEnvCheck').authEnvCheck;
}

/**
 * # DEV TIP
 *
 * Wanting to extend StudioCMS? You can do so by defining a new module in the `virtual:studiocms` namespace within your project with the following format:
 *
 * This module can also be delcared from `@astrolicious/studiocms`.
 *
 * @example
 * declare module 'virtual:studiocms/config' {
 * const Config: import('@astrolicious/studiocms').StudioCMSOptions;
 * export default Config;
 * }
 */
declare module 'virtual:studiocms/config' {
	const Config: import('@studiocms/core/schemas').StudioCMSConfig;
	export default Config;
}

declare module 'virtual:studiocms/version' {
	const version: string;
	export default version;
}

declare module 'virtual:studiocms/astromdremarkConfig' {
	const markdownConfig: import('astro').AstroConfig['markdown'];
	export default markdownConfig;
}

declare module 'virtual:studiocms/pluginSystem' {
	export const externalNav: typeof import('@studiocms/core/lib').externalNavigation;
	export const dashboardPageLinks: typeof import('@studiocms/core/lib').dashboardPageLinksMap;
	export const pluginList: typeof import('@studiocms/core/lib').studioCMSPluginList;
	export const customRenderers: string[];
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
	export const getPageById: typeof import('@studiocms/core/helpers').getPageById;
	export const getPageList: typeof import('@studiocms/core/helpers').getPageList;
	export const getUserList: typeof import('@studiocms/core/helpers').getUserList;
	export const getUserById: typeof import('@studiocms/core/helpers').getUserById;
	export const getPermissionsList: typeof import('@studiocms/core/helpers').getPermissionsList;
	export type ContentHelperTempResponse =
		import('@studiocms/core/helpers').ContentHelperTempResponse;
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
	export const makeNonDashboardRoute: typeof import('@studiocms/core/helpers').makeNonDashboardRoute;
	export const makeDashboardRoute: typeof import('@studiocms/core/helpers').makeDashboardRoute;
	export const makeAPIDashboardRoute: typeof import('@studiocms/core/helpers').makeAPIDashboardRoute;
	export const StudioCMSRoutes: typeof import('@studiocms/core/helpers').StudioCMSRoutes;
	export const sideBarLinkMap: typeof import('@studiocms/core/helpers').sideBarLinkMap;
}
