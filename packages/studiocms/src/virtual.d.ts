declare module 'studiocms:logger' {
	export const logger: import('astro').AstroIntegrationLogger;
	export default logger;

	export const isVerbose: boolean;

	export const apiResponseLogger: (
		status: number,
		message: string,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		error?: Error | any
	) => Response;
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

declare module 'studiocms:plugins/endpoints' {
	export const apiEndpoints: {
		identifier: string;
		onCreate: import('astro').APIRoute | null;
		onEdit: import('astro').APIRoute | null;
		onDelete: import('astro').APIRoute | null;
	}[];

	export const settingsEndpoints: {
		identifier: string;
		onSave: import('astro').APIRoute | null;
	}[];
}

declare module 'studiocms:plugins/renderers' {
	export const pluginRenderers: {
		pageType: string;
		safePageType: string;
	}[];

	export const mdPreRender: typeof import('./components/renderers/markdown-prerender').preRender;
}

declare module 'studiocms:mailer' {
	type Mod = typeof import('./lib/mailer/index');
	export const Mailer: Mod['Mailer'];

	// Table Def
	export const tsMailerConfig: import('./lib/mailer/index').tsMailerConfig;
	// Types
	export type tsMailer = import('./lib/mailer/index').tsMailer;
	export type tsMailerInsert = import('./lib/mailer/index').tsMailerInsert;
	export type TransporterConfig = import('./lib/mailer/index').TransporterConfig;
	export type MailerConfig = import('./lib/mailer/index').MailerConfig;
	export type MailOptions = import('./lib/mailer/index').MailOptions;
	export type MailerResponse = import('./lib/mailer/index').MailerResponse;

	// Functions and Consts
	/**
	 * @deprecated
	 */
	export const sendMail: typeof import('./lib/mailer/index').sendMail;
	/**
	 * @deprecated
	 */
	export const verifyMailConnection: typeof import('./lib/mailer/index').verifyMailConnection;
	/**
	 * @deprecated
	 */
	export const getMailerConfigTable: typeof import('./lib/mailer/index').getMailerConfigTable;
	/**
	 * @deprecated
	 */
	export const updateMailerConfigTable: typeof import('./lib/mailer/index').updateMailerConfigTable;
	/**
	 * @deprecated
	 */
	export const createMailerConfigTable: typeof import('./lib/mailer/index').createMailerConfigTable;
	/**
	 * @deprecated
	 */
	export const isMailerEnabled: typeof import('./lib/mailer/index').isMailerEnabled;
}

declare module 'studiocms:mailer/templates' {
	export const getTemplate: typeof import('./lib/mailer/template').getTemplate;
	export default getTemplate;
}

declare module 'studiocms:notifier' {
	type Mod = typeof import('./lib/notifier/index');
	export const Notifications: Mod['Notifications'];

	export type UserNotification = import('./lib/notifier/index').UserNotification;
	export type EditorNotification = import('./lib/notifier/index').EditorNotification;
	export type AdminNotification = import('./lib/notifier/index').AdminNotification;
	export const notificationTypes: typeof import('./lib/notifier/index').notificationTypes;
	export const notificationTitleStrings: typeof import(
		'./lib/notifier/index'
	).notificationTitleStrings;

	/**
	 * @deprecated
	 */
	export const sendUserNotification: typeof import('./lib/notifier/index').sendUserNotification;
	/**
	 * @deprecated
	 */
	export const sendEditorNotification: typeof import('./lib/notifier/index').sendEditorNotification;
	/**
	 * @deprecated
	 */
	export const sendAdminNotification: typeof import('./lib/notifier/index').sendAdminNotification;
}

declare module 'studiocms:notifier/client' {
	export type UserNotificationOptions = import('./lib/notifier/client').UserNotificationOptions;
	export const getEnabledNotificationCheckboxes: typeof import(
		'./lib/notifier/client'
	).getEnabledNotificationCheckboxes;
	export const formatNotificationOptions: typeof import(
		'./lib/notifier/client'
	).formatNotificationOptions;
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
	export const defaultLang: typeof import('./lib/i18n/index').defaultLang;
}

declare module 'studiocms:i18n/client' {
	export const $localeSettings: typeof import('./lib/i18n/client').$localeSettings;
	export const $locale: typeof import('./lib/i18n/client').$locale;
	export const format: typeof import('./lib/i18n/client').format;
	export const $i18n: typeof import('./lib/i18n/client').$i18n;
	export const baseTranslation: typeof import('./lib/i18n/client').baseTranslation;
	export const documentUpdater: typeof import('./lib/i18n/client').documentUpdater;
	export const makeTranslation: typeof import('./lib/i18n/client').makeTranslation;
	export const updateElmLabel: typeof import('./lib/i18n/client').updateElmLabel;
	export const defaultLang: typeof import('./lib/i18n/client').defaultLang;
	export const uiTranslationsAvailable: typeof import('./lib/i18n/client').uiTranslationsAvailable;
	export type UiTranslationKey = import('./lib/i18n/client').UiTranslationKey;
	export const pageHeaderUpdater: typeof import('./lib/i18n/client').pageHeaderUpdater;
	export const updateSelectElmLabel: typeof import('./lib/i18n/client').updateSelectElmLabel;
	export const updateElmPlaceholder: typeof import('./lib/i18n/client').updateElmPlaceholder;
	export const updateToggleElmLabel: typeof import('./lib/i18n/client').updateToggleElmLabel;
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
	type Mod = typeof import('./sdk/index.js');

	/**
	 * The new Effect-TS based SDK implementation that replaces the deprecated SDK.
	 * This unified SDK merges the normal and cached SDK functionalities.
	 *
	 * @example
	 * ```ts
	 * import { Effect } from 'studiocms/effect';
	 * import { SDKCore } from 'studiocms:sdk';
	 *
	 * const db = Effect.gen(function* () {
	 *   const sdk = yield* SDKCore;
	 *
	 *   return sdk.db;
	 * }).pipe(Effect.provide(SDKCore.Default));
	 * ```
	 */
	export const SDKCore: Mod['SDKCore'];

	/**
	 * VanillaJS Version of the SDKCore. Most internal functions will still contain Effects, you can use `runSDK` from the 'studiocms:sdk` to run these as normal async functions
	 *
	 * @example
	 * ```ts
	 * import { SDKCoreJs, runSDK } from 'studiocms:sdk';
	 *
	 * const pages = await runSDK(SDKCoreJs.GET.pages());
	 * ```
	 */
	export const SDKCoreJs: Mod['SDKCoreJs'];

	/**
	 * Utility function for running components of the SDKCoreJs
	 *
	 * @example
	 * ```ts
	 * import { SDKCoreJs, runSDK } from 'studiocms:sdk';
	 *
	 * const pages = await runSDK(SDKCoreJs.GET.pages());
	 * ```
	 */
	export const runSDK: Mod['runSDK'];

	/**
	 * @deprecated use `SDKCore` Effect from 'studiocms:sdk'
	 */
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
	export type tsEmailVerificationTokensInsert = import(
		'./sdk/types/index.js'
	).tsEmailVerificationTokensInsert;
	export type tsEmailVerificationTokensSelect = import(
		'./sdk/types/index.js'
	).tsEmailVerificationTokensSelect;
	export type tsNotificationSettingsInsert = import(
		'./sdk/types/index.js'
	).tsNotificationSettingsInsert;
	export type tsNotificationSettingsSelect = import(
		'./sdk/types/index.js'
	).tsNotificationSettingsSelect;
}

declare module 'studiocms:sdk/cache' {
	/**
	 * @deprecated use `SDKCore` Effect from 'studiocms:sdk'
	 */
	const studioCMS_SDK_Cache: import('./sdk/types/index.js').STUDIOCMS_SDK_CACHE;
	export default studioCMS_SDK_Cache;

	export type STUDIOCMS_SDK_CACHE = import('./sdk/cache.js').STUDIOCMS_SDK_CACHE;
	export type PageDataCacheObject = import('./sdk/cache.js').PageDataCacheObject;
	export type SiteConfigCacheObject = import('./sdk/cache.js').SiteConfigCacheObject;
	export type VersionCacheObject = import('./sdk/cache.js').VersionCacheObject;
}

declare module 'studiocms-dashboard:web-vitals' {
	export const getWebVitals: typeof import('./lib/webVitals/webVital').getWebVitals;
	export type WebVitalsResponseItem = import('./lib/webVitals/webVital').WebVitalsResponseItem;
}

declare module 'studiocms:auth/utils/authEnvCheck' {
	export const authEnvCheck: typeof import('./utils/authEnvCheck.js').authEnvCheck;
}

declare module 'studiocms:auth/utils/validImages' {
	export const validImages: typeof import('./utils/validImages.js').validImages;
}

declare module 'studiocms:auth/utils/getLabelForPermissionLevel' {
	export const getLabelForPermissionLevel: typeof import(
		'./utils/getLabelForPermissionLevel.js'
	).getLabelForPermissionLevel;
}

declare module 'studiocms:auth/scripts/three' {
	/**
	 * This module should be imported within a script tag.
	 * @example <script>import "studiocms:auth/scripts/three";</script>
	 */

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const defaultExport: any;
	export default defaultExport;
}

declare module 'studiocms:auth/scripts/formListener' {
	export const formListener: typeof import('./scripts/formListener.js').formListener;
}

declare module 'studiocms:auth/lib/encryption' {
	type Mod = typeof import('./lib/auth/encryption.js');
	export const Encryption: Mod['Encryption'];

	/**
	 * Encrypts the given data using AES-128-GCM encryption.
	 *
	 * @param data - The data to be encrypted as a Uint8Array.
	 * @returns The encrypted data as a Uint8Array, which includes the initialization vector (IV), the encrypted content, and the authentication tag.
	 */
	export const encrypt: Mod['encrypt'];
	/**
	 * Encrypts a given string and returns the encrypted data as a Uint8Array.
	 *
	 * @param data - The string to be encrypted.
	 * @returns The encrypted data as a Uint8Array.
	 */
	export const encryptString: Mod['encryptString'];
	/**
	 * Decrypts the given encrypted data using AES-128-GCM.
	 *
	 * @param encrypted - The encrypted data as a Uint8Array. The data must be at least 33 bytes long.
	 * @returns The decrypted data as a Uint8Array.
	 * @throws Will throw an error if the encrypted data is less than 33 bytes.
	 */
	export const decrypt: Mod['decrypt'];
	/**
	 * Decrypts the given Uint8Array data and returns the result as a string.
	 *
	 * @param data - The encrypted data as a Uint8Array.
	 * @returns The decrypted data as a string.
	 */
	export const decryptToString: Mod['decryptToString'];
}

declare module 'studiocms:auth/lib/password' {
	type Mod = typeof import('./lib/auth/password.js');
	export const Password: Mod['Password'];

	/**
	 * Hashes a plain text password using bcrypt.
	 *
	 * @param password - The plain text password to hash.
	 * @returns A promise that resolves to the hashed password.
	 */
	export const hashPassword: Mod['hashPassword'];
	/**
	 * Verifies if the provided password matches the hashed password.
	 *
	 * @param hash - The hashed password to compare against.
	 * @param password - The plain text password to verify.
	 * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
	 */
	export const verifyPasswordHash: Mod['verifyPasswordHash'];
	/**
	 * Verifies the strength of a given password.
	 *
	 * The password must meet the following criteria:
	 * - Be between 6 and 255 characters in length.
	 * - Not be a known unsafe password.
	 * - Not be found in the pwned password database.
	 *
	 * @param password - The password to verify.
	 * @returns A promise that resolves to `true` if the password is strong/secure enough, otherwise `false`.
	 */
	export const verifyPasswordStrength: Mod['verifyPasswordStrength'];
}

declare module 'studiocms:auth/lib/session' {
	type Mod = typeof import('./lib/auth/session.js');
	export const Session: Mod['Session'];

	/**
	 * Generates a new session token.
	 *
	 * @returns The generated session token as a string.
	 */
	export const generateSessionToken: Mod['generateSessionToken'];
	/**
	 * The name of the cookie used to store the authentication session.
	 *
	 * @constant {string}
	 */
	export const sessionCookieName: Mod['sessionCookieName'];
	/**
	 * Creates a new session for a user.
	 *
	 * @param token - The token used to create the session.
	 * @param userId - The ID of the user for whom the session is being created.
	 * @returns A promise that resolves to the created session object.
	 */
	export const createSession: Mod['createSession'];
	/**
	 * Validates a session token by checking its existence and expiration in the database.
	 * If the session is valid but close to expiration, it extends the session expiration time.
	 * If the session is expired, it deletes the session from the database.
	 *
	 * @param token - The session token to validate.
	 * @returns A promise that resolves to an object containing the session and user information. If the session is invalid or expired, both session and user will be null.
	 */
	export const validateSessionToken: Mod['validateSessionToken'];
	/**
	 * Invalidates a session by deleting it from the database.
	 *
	 * @param token - The session token to invalidate.
	 * @returns A promise that resolves to `true` if the session was successfully invalidated; otherwise, `false`.
	 */
	export const invalidateSession: Mod['invalidateSession'];
	/**
	 * Sets the session token cookie in the response object.
	 *
	 * @param context - The context object containing the request and response objects.
	 * @param token - The session token to set in the cookie.
	 * @param expiresAt - The expiration date and time of the session token.
	 */
	export const setSessionTokenCookie: Mod['setSessionTokenCookie'];
	/**
	 * Deletes the session token cookie from the response object.
	 *
	 * @param context - The context object containing the request and response objects.
	 */
	export const deleteSessionTokenCookie: Mod['deleteSessionTokenCookie'];
	/**
	 * Sets the OAuth session token cookie in the response object.
	 *
	 * @param context - The context object containing the request and response objects.
	 * @param key - The name of the cookie to set.
	 * @param expiresAt - The expiration date and time of the session token.
	 */
	export const setOAuthSessionTokenCookie: Mod['setOAuthSessionTokenCookie'];
	/**
	 * Generates a new expiration date for a session.
	 *
	 * @returns The expiration date calculated by adding the session expiration time to the current date and time.
	 */
	export const makeExpirationDate: Mod['makeExpirationDate'];
	/**
	 * The session expiration time in milliseconds.
	 * This value represents 14 days.
	 */
	export const sessionExpTime: Mod['sessionExpTime'];
	/**
	 * Creates a new user session.
	 *
	 * @param userId - The ID of the user to create the session for.
	 * @param context - The context object containing the request and response objects.
	 * @returns A promise that resolves to the created session object.
	 */
	export const createUserSession: Mod['createUserSession'];
}

declare module 'studiocms:auth/lib/types' {
	/**
	 * Represents a table of OAuth accounts.
	 *
	 * @interface OAuthAccountsTable
	 * @property {string} provider - The name of the OAuth provider (e.g., Google, Facebook).
	 * @property {string} providerUserId - The unique identifier for the user provided by the OAuth provider.
	 * @property {string} userId - The unique identifier for the user within the application.
	 */
	export type OAuthAccountsTable = import('./lib/auth/types.js').OAuthAccountsTable;
	/**
	 * Interface representing a table of user permissions.
	 *
	 * @interface PermissionsTable
	 * @property {string} user - The username of the individual.
	 * @property {string} rank - The rank or role assigned to the user.
	 */
	export type PermissionsTable = import('./lib/auth/types.js').PermissionsTable;
	/**
	 * Represents the session data for a user.
	 *
	 * @property {boolean} isLoggedIn - Indicates whether the user is logged in.
	 * @property {UserTable | null} user - The user data, or null if no user is logged in.
	 * @property {'owner' | 'admin' | 'editor' | 'visitor' | 'unknown'} permissionLevel - The permission level of the user.
	 */
	export type UserSessionData = import('./lib/auth/types.js').UserSessionData;
	/**
	 * Represents a user session which includes user information and session details.
	 *
	 * @property {UserTable} user - The user data.
	 * @property {SessionTable} session - The session data.
	 */
	export type UserSession = import('./lib/auth/types.js').UserSession;
	/**
	 * Represents the result of validating a session token.
	 *
	 * This type can either be a valid `UserSession` or an object indicating an invalid session with both `session` and `user` properties set to `null`.
	 */
	export type SessionValidationResult = import('./lib/auth/types.js').SessionValidationResult;
	/**
	 * Represents an individual refillable token bucket.
	 *
	 * @interface RefillBucket
	 * @property {number} count - The current token count in the bucket.
	 * @property {number} refillAt - The time at which the bucket was last refilled.
	 */
	export type RefillBucket = import('./lib/auth/types.js').RefillBucket;
	/**
	 * Represents a bucket with an expiration mechanism.
	 *
	 * @interface ExpiringBucket
	 * @property {number} count - The current token count in the bucket.
	 * @property {number} createdAt - The timestamp when the bucket was created.
	 */
	export type ExpiringBucket = import('./lib/auth/types.js').ExpiringBucket;
	/**
	 * Interface representing a throttling counter.
	 *
	 * @interface ThrottlingCounter
	 * @property {number} timeout - The duration (in milliseconds) for which the throttling is applied.
	 * @property {number} updatedAt - The timestamp (in milliseconds since epoch) when the throttling counter was last updated.
	 */
	export type ThrottlingCounter = import('./lib/auth/types.js').ThrottlingCounter;
}

declare module 'studiocms:auth/lib/user' {
	type Mod = typeof import('./lib/auth/user.js');
	export const User: Mod['User'];

	/**
	 * Verifies if the provided username meets the required criteria.
	 *
	 * The username must:
	 * - Be between 3 and 32 characters in length.
	 * - Contain only lowercase letters, numbers, hyphens (-), and underscores (_).
	 * - Not be considered unsafe.
	 *
	 * @param username - The username to verify.
	 * @returns `true` if the username is valid, `false` otherwise.
	 */
	export const verifyUsernameInput: typeof import('./lib/auth/user.js').verifyUsernameInput;
	/**
	 * Creates a user avatar URL based on the provided email.
	 *
	 * This function takes an email address, processes it to generate a unique hash,
	 * and returns a URL for the user's avatar using the Libravatar service.
	 *
	 * @param email - The email address of the user.
	 * @returns A promise that resolves to the URL of the user's avatar.
	 */
	export const createUserAvatar: typeof import('./lib/auth/user.js').createUserAvatar;
	/**
	 * Creates a new local user with the provided details.
	 *
	 * @param name - The full name of the user.
	 * @param username - The username for the user.
	 * @param email - The email address of the user.
	 * @param password - The password for the user.
	 * @returns A promise that resolves to the newly created user record.
	 */
	export const createLocalUser: typeof import('./lib/auth/user.js').createLocalUser;
	/**
	 * Creates a new user with OAuth credentials.
	 *
	 * @param userFields - The fields required to create a new user.
	 * @param oAuthFields - The OAuth provider information, including the provider name and provider user ID.
	 * @returns The newly created user object or an error object if the creation fails.
	 */
	export const createOAuthUser: typeof import('./lib/auth/user.js').createOAuthUser;
	/**
	 * Updates the password for a user.
	 *
	 * This function hashes the provided password and updates the user's password
	 * in the database with the hashed password.
	 *
	 * @param userId - The unique identifier of the user whose password is to be updated.
	 * @param password - The new password to be set for the user.
	 * @returns A promise that resolves when the password has been successfully updated.
	 */
	export const updateUserPassword: typeof import('./lib/auth/user.js').updateUserPassword;
	/**
	 * Retrieves the password hash for a given user by their user ID.
	 *
	 * @param userId - The unique identifier of the user whose password hash is to be retrieved.
	 * @returns A promise that resolves to the password hash of the user.
	 * @throws Will throw an error if the user is not found or if the user does not have a password.
	 */
	export const getUserPasswordHash: typeof import('./lib/auth/user.js').getUserPasswordHash;
	/**
	 * Retrieves a user from the database based on their email address.
	 *
	 * @param email - The email address of the user to retrieve.
	 * @returns A promise that resolves to the user data if found, or null if no user is found with the given email.
	 */
	export const getUserFromEmail: typeof import('./lib/auth/user.js').getUserFromEmail;
	/**
	 * Retrieves user session data based on the provided Astro context.
	 *
	 * @param Astro - The Astro global object or API context containing cookies.
	 * @returns A promise that resolves to the user session data.
	 *
	 * The function performs the following steps:
	 * 1. Extracts the session token from cookies.
	 * 2. If no session token is found, returns an object indicating the user is not logged in.
	 * 3. Validates the session token.
	 * 4. If the session is invalid, deletes the session token cookie and returns an object indicating the user is not logged in.
	 * 5. If the user is not found, returns an object indicating the user is not logged in.
	 * 6. Retrieves the user's permission level from the database.
	 * 7. Returns an object containing the user's login status, user information, and permission level.
	 */
	export const getUserData: typeof import('./lib/auth/user.js').getUserData;
	/**
	 * A mapping of permission ranks to their respective allowed roles.
	 *
	 * This map defines the hierarchy of permissions, where each rank includes
	 * all the roles of the ranks below it. For example, an 'admin' has the roles
	 * of both 'owner' and 'admin', while an 'editor' has the roles of 'owner',
	 * 'admin', and 'editor'.
	 *
	 * @property {string[]} owner - The 'owner' rank, which includes only the 'owner' role.
	 * @property {string[]} admin - The 'admin' rank, which includes 'owner' and 'admin' roles.
	 * @property {string[]} editor - The 'editor' rank, which includes 'owner', 'admin', and 'editor' roles.
	 * @property {string[]} visitor - The 'visitor' rank, which includes 'owner', 'admin', 'editor', and 'visitor' roles.
	 * @property {string[]} unknown - The 'unknown' rank, which includes all roles: 'owner', 'admin', 'editor', 'visitor', and 'unknown'.
	 */
	export const permissionRanksMap: typeof import('./lib/auth/user.js').permissionRanksMap;
	/**
	 * The name of the cookie used for linking a new OAuth account.
	 * This constant is used to identify the specific cookie that handles
	 * the linking process for new OAuth accounts.
	 */
	export const LinkNewOAuthCookieName: typeof import('./lib/auth/user.js').LinkNewOAuthCookieName;
	/**
	 * An enumeration representing different user permission levels.
	 *
	 * The permission levels are defined as follows:
	 * - visitor: 1
	 * - editor: 2
	 * - admin: 3
	 * - owner: 4
	 * - unknown: 0
	 */
	export enum UserPermissionLevel {
		visitor = 1,
		editor = 2,
		admin = 3,
		owner = 4,
		unknown = 0,
	}
	/**
	 * Retrieves the user's permission level based on their session data.
	 *
	 * @param userData - The session data of the user, which includes their permission level.
	 * @returns The user's permission level as an enum value. `UserPermissionLevel`
	 */
	export const getUserPermissionLevel: typeof import('./lib/auth/user.js').getUserPermissionLevel;

	export const isUserAllowed: Mod['isUserAllowed'];
}

declare module 'studiocms:auth/lib/verify-email' {
	type Mod = typeof import('./lib/auth/verify-email.js');
	export const VerifyEmail: Mod['VerifyEmail'];
	export const getEmailVerificationRequest: typeof import(
		'./lib/auth/verify-email.js'
	).getEmailVerificationRequest;
	export const deleteEmailVerificationRequest: typeof import(
		'./lib/auth/verify-email.js'
	).deleteEmailVerificationRequest;
	export const createEmailVerificationRequest: typeof import(
		'./lib/auth/verify-email.js'
	).createEmailVerificationRequest;
	export const sendVerificationEmail: typeof import(
		'./lib/auth/verify-email.js'
	).sendVerificationEmail;
	export const isEmailVerified: typeof import('./lib/auth/verify-email.js').isEmailVerified;
	export const isEmailVerificationEnabled: typeof import(
		'./lib/auth/verify-email.js'
	).isEmailVerificationEnabled;
}

declare module 'virtual:studiocms/plugins/renderers' {
	export const studiocms_markdown: typeof import(
		'./components/renderers/studiocms-markdown.astro'
	).default;
	export const studiocms_html: typeof import('./components/renderers/studiocms-html.astro').default;
}

declare module 'studiocms:renderer' {
	export const StudioCMSRenderer: typeof import('./components/Renderer.astro').default;
}

declare module 'studiocms:renderer/config' {
	const config: import('./schemas/config/pageTypeOptions').MarkdownSchemaOptions;
	export default config;
}

declare module 'virtual:studiocms/sdk/env' {
	export const dbUrl: string;
	export const dbSecret: string;
	export const cmsEncryptionKey: string;
}

declare module 'virtual:studiocms/sitemaps' {
	export const sitemaps: string[];
}

declare namespace App {
	interface Locals {
		latestVersion: import('./sdk/types/index').VersionCacheObject;
		siteConfig: import('./sdk/types/index').SiteConfigCacheObject;
		userSessionData: import('./lib/auth/types').UserSessionData;
		emailVerificationEnabled: boolean;
		defaultLang: import('./lib/i18n/config').UiTranslationKey;
		routeMap: typeof import('./lib/routeMap').StudioCMSRoutes;

		SCMSGenerator: string;
		SCMSUiGenerator: string;

		userPermissionLevel: {
			isVisitor: boolean;
			isEditor: boolean;
			isAdmin: boolean;
			isOwner: boolean;
		};
	}
}
