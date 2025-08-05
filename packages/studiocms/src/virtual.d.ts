declare module 'studiocms:logger' {
	export const logger: import('astro').AstroIntegrationLogger;
	export default logger;

	export const isVerbose: boolean;

	export const apiResponseLogger: (
		status: number,
		message: string,
		// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any
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
	export const notificationTitleStrings: typeof import('./lib/notifier/index').notificationTitleStrings;
}

declare module 'studiocms:notifier/client' {
	export type UserNotificationOptions = import('./lib/notifier/client').UserNotificationOptions;
	export const getEnabledNotificationCheckboxes: typeof import('./lib/notifier/client').getEnabledNotificationCheckboxes;
	export const formatNotificationOptions: typeof import('./lib/notifier/client').formatNotificationOptions;
}

declare module 'studiocms:config' {
	export const config: import('./schemas/index.js').StudioCMSConfig;
	export default config;

	export const dashboardConfig: import('./schemas/index.js').StudioCMSConfig['features']['dashboardConfig'];
	export const authConfig: import('./schemas/index.js').StudioCMSConfig['features']['authConfig'];
	export const developerConfig: import('./schemas/index.js').StudioCMSConfig['features']['developerConfig'];
	export const sdk: import('./schemas/index.js').StudioCMSConfig['features']['sdk'];
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
	export const languageSelectorOptions: typeof import('./lib/i18n/index.js').languageSelectorOptions;
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
	export const removeLeadingTrailingSlashes: typeof import('./lib/removeLeadingTrailingSlashes.js').removeLeadingTrailingSlashes;
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

	export const getPluginDashboardPages: typeof import('./lib/plugins/index.js').getPluginDashboardPages;
	export const frontendNavigation: typeof import('./lib/plugins/index.js').frontendNavigation;
}

declare module 'studiocms:component-registry' {
	/**
	 * List of component keys that are registered in the component registry.
	 */
	export const componentKeys: string[];

	/**
	 * List of component properties that are registered in the component registry.
	 *
	 * Each entry in the array is an object with a `name` and `props` property.
	 * The `props` property is an array of objects representing the properties of the component.
	 */
	export const componentProps: import('./componentRegistry/types.js').ComponentRegistryEntry[];
}

declare module 'studiocms:component-registry/runtime' {
	/**
	 * Represents an entry in the component registry.
	 *
	 * Extends the `AstroComponentProps` interface to include additional metadata.
	 *
	 * @property safeName - A readonly string representing a safe, unique identifier for the component.
	 */
	export type ComponentRegistryEntry =
		import('./componentRegistry/runtime.js').ComponentRegistryEntry;

	/**
	 * Imports components by their keys from the 'studiocms:markdown-remark/user-components' module.
	 *
	 * @param keys - An array of strings representing the keys of the components to import.
	 * @returns A promise that resolves to an object containing the imported components.
	 * @throws {MarkdownRemarkError} If any component fails to import, an error is thrown with a prefixed message.
	 * @deprecated This function is deprecated and will be removed in future versions.
	 * Use `getRendererComponents` instead for importing components from the component registry.
	 */
	export const importComponentsKeys: typeof import('./componentRegistry/runtime.js').importComponentsKeys;

	/**
	 * @returns A promise that resolves to an object containing the imported components.
	 */
	export const getRendererComponents: typeof import('./componentRegistry/runtime.js').getRendererComponents;

	/**
	 * Returns the component registry entries.
	 *
	 * @returns {ComponentRegistryEntry[]} An object mapping safe component names to their registry entries.
	 */
	export const getRegistryComponents: typeof import('./componentRegistry/runtime.js').getRegistryComponents;

	/**
	 * List of component properties that are registered in the component registry.
	 *
	 * Each entry in the array is an object with a `name` and `props` property.
	 * The `props` property is an array of objects representing the properties of the component.
	 */
	export const componentProps: import('./componentRegistry/runtime.js').ComponentRegistryEntry[];

	/**
	 * Converts all underscores in a given string to hyphens.
	 *
	 * @param str - The input string containing underscores to be converted.
	 * @returns A new string with all underscores replaced by hyphens.
	 */
	export const convertUnderscoresToHyphens: typeof import('./componentRegistry/runtime.js').convertUnderscoresToHyphens;
	/**
	 * Converts all hyphens in a given string to underscores.
	 *
	 * @param str - The input string containing hyphens to be converted.
	 * @returns A new string with all hyphens replaced by underscores.
	 */
	export const convertHyphensToUnderscores: typeof import('./componentRegistry/runtime.js').convertHyphensToUnderscores;

	export const setupRendererComponentProxy: typeof import('./componentRegistry/runtime.js').setupRendererComponentProxy;

	export const createRenderer: typeof import('./componentRegistry/runtime.js').createRenderer;
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
	 * VanillaJS Version of the SDKCore. Most internal functions will still contain Effects, you can use `runSDK` from the 'studiocms:sdk' to run these as normal async functions
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
}

declare module 'studiocms:sdk/types' {
	// src/sdk/types/index
	export type UsePluginDataOptsBase<T> = import('./sdk/types/index').UsePluginDataOptsBase<T>;
	export type UsePluginDataOpts<T> = import('./sdk/types/index').UsePluginDataOpts<T>;
	export type UserPluginDataOptsImplementation<T> = import('./sdk/types/index').UserPluginDataOptsImplementation<T>;
	export type PluginDataEntry<T> = import('./sdk/types/index').PluginDataEntry<T>;
	export type JSONValidatorFn<T> = import('./sdk/types/index').JSONValidatorFn<T>;
	export type EffectSchemaValidator<T> = import('./sdk/types/index').EffectSchemaValidator<T>;
	export type ZodValidator<T> = import('./sdk/types/index').ZodValidator<T>;
	export type ValidatorOptions<T> = import('./sdk/types/index').ValidatorOptions<T>;
	export type CacheMap<K, V> = import('./sdk/types/index').CacheMap<K, V>;
	export type PaginateInput = import('./sdk/types/index').PaginateInput;
	export type MetaOnlyPageData = import('./sdk/types/index').MetaOnlyPageData;
	export type PageDataReturnType<T> = import('./sdk/types/index').PageDataReturnType<T>;
	export type PageDataCacheReturnType<T> = import('./sdk/types/index').PageDataCacheReturnType<T>;
	export type diffItem = import('./sdk/types/index').diffItem;
	export type diffReturn = import('./sdk/types/index').diffReturn;
	export type DiffReturnType<T> = import('./sdk/types/index').DiffReturnType<T>;
	export type FolderNode = import('./sdk/types/index').FolderNode;
	export type FolderListItem = import('./sdk/types/index').FolderListItem;
	export type AstroDBVirtualModule = import('./sdk/types/index').AstroDBVirtualModule;
	export type CacheConfig = import('./sdk/types/index').CacheConfig;
	export type ProcessedCacheConfig = import('./sdk/types/index').ProcessedCacheConfig;
	export type ProcessedSDKConfig = import('./sdk/types/index').ProcessedSDKConfig;
	export type BaseCacheObject = import('./sdk/types/index').BaseCacheObject;
	export type PageDataCacheObject = import('./sdk/types/index').PageDataCacheObject;
	export type MetaOnlyPageDataCacheObject = import('./sdk/types/index').MetaOnlyPageDataCacheObject;
	export type SiteConfigCacheObject = import('./sdk/types/index').SiteConfigCacheObject;
	export type VersionCacheObject = import('./sdk/types/index').VersionCacheObject;
	export type FolderTreeCacheObject = import('./sdk/types/index').FolderTreeCacheObject;
	export type FolderListCacheObject = import('./sdk/types/index').FolderListCacheObject;
	export type addDatabaseEntryInsertPage = import('./sdk/types/index').addDatabaseEntryInsertPage;
	export type CombinedUserData = import('./sdk/types/index').CombinedUserData;
	export type CombinedPageData = import('./sdk/types/index').CombinedPageData;
	export type DeletionResponse = import('./sdk/types/index').DeletionResponse;
	export type PageInsert = import('./sdk/types/index').PageInsert;
	export type MultiPageInsert = import('./sdk/types/index').MultiPageInsert;

	// src/sdk/types/tableDefs
	export type SiteConfig = import('./sdk/types/index').SiteConfig;
	export type PageDataStripped = import('./sdk/types/index').PageDataStripped;
	export type PageDataReturnId = import('./sdk/types/index').PageDataReturnId;
	export type PageContentReturnId = import('./sdk/types/index').PageContentReturnId;
	export type PageDataTagsInsertResponse = import('./sdk/types/index').PageDataTagsInsertResponse;
	export type PageDataCategoriesInsertResponse = import('./sdk/types/index').PageDataCategoriesInsertResponse;
	export type DatabaseTables = import('./sdk/types/index').DatabaseTables;
	export type SingleRank = import('./sdk/types/index').SingleRank;
	export type CombinedRank = import('./sdk/types/index').CombinedRank;
	export type AvailableLists = import('./sdk/types/index').AvailableLists;

	// src/sdk/types/tsAlias
	export type tsPluginDataInsert = import('./sdk/types/index').tsPluginDataInsert;
	export type tsPluginDataSelect = import('./sdk/types/index').tsPluginDataSelect;
	export type tsEmailVerificationTokensInsert = import('./sdk/types/index').tsEmailVerificationTokensInsert;
	export type tsEmailVerificationTokensSelect = import('./sdk/types/index').tsEmailVerificationTokensSelect
	export type tsNotificationSettingsInsert = import('./sdk/types/index').tsNotificationSettingsInsert;
	export type tsNotificationSettingsSelect = import('./sdk/types/index').tsNotificationSettingsSelect;
	export type tsUserResetTokensInsert = import('./sdk/types/index').tsUserResetTokensInsert;
	export type tsUserResetTokensSelect = import('./sdk/types/index').tsUserResetTokensSelect
	export type tsPageFolderSelect = import('./sdk/types/index').tsPageFolderSelect;
	export type tsPageFolderInsert = import('./sdk/types/index').tsPageFolderInsert;
	export type tsUsersSelect = import('./sdk/types/index').tsUsersSelect;
	export type tsUsersInsert = import('./sdk/types/index').tsUsersInsert;
	export type tsUsersUpdate = import('./sdk/types/index').tsUsersUpdate;
	export type tsOAuthAccountsSelect = import('./sdk/types/index').tsOAuthAccountsSelect;
	export type tsSessionTableSelect = import('./sdk/types/index').tsSessionTableSelect;
	export type tsSessionTableInsert = import('./sdk/types/index').tsSessionTableInsert;
	export type tsPermissionsSelect = import('./sdk/types/index').tsPermissionsSelect;
	export type tsPermissionsInsert = import('./sdk/types/index').tsPermissionsInsert;
	export type tsPageDataSelect = import('./sdk/types/index').tsPageDataSelect;
	export type tsPageDataInsert = import('./sdk/types/index').tsPageDataInsert;
	export type tsPageDataTagsSelect = import('./sdk/types/index').tsPageDataTagsSelect;
	export type tsPageDataTagsInsert = import('./sdk/types/index').tsPageDataTagsInsert;
	export type tsPageDataCategoriesSelect = import('./sdk/types/index').tsPageDataCategoriesSelect;
	export type tsPageDataCategoriesInsert = import('./sdk/types/index').tsPageDataCategoriesInsert;
	export type tsPageContentSelect = import('./sdk/types/index').tsPageContentSelect;
	export type tsPageContentInsert = import('./sdk/types/index').tsPageContentInsert;
	export type tsDiffTrackingSelect = import('./sdk/types/index').tsDiffTrackingSelect;
	export type tsDiffTrackingInsert = import('./sdk/types/index').tsDiffTrackingInsert;
	export type tsSiteConfigSelect = import('./sdk/types/index').tsSiteConfigSelect;
	export type tsSiteConfigInsert = import('./sdk/types/index').tsSiteConfigInsert;
	export type CombinedInsertContent = import('./sdk/types/index').CombinedInsertContent;
}

declare module 'studiocms-dashboard:web-vitals' {
	export const getWebVitals: typeof import('./lib/webVitals/webVital').getWebVitals;
	export type WebVitalsResponseItem = import('./lib/webVitals/webVital').WebVitalsResponseItem;
}

declare module 'studiocms:auth/utils/authEnvCheck' {
	/** @deprecated */
	export const authEnvCheck: typeof import('./utils/authEnvCheck.js').authEnvCheck;
	/** @deprecated */
	export type AuthEnvCheckResponse = import('./utils/authEnvCheck.js').AuthEnvCheckResponse;
}

declare module 'studiocms:auth/utils/validImages' {
	export const validImages: typeof import('./utils/validImages.js').validImages;
}

declare module 'studiocms:auth/utils/getLabelForPermissionLevel' {
	export const getLabelForPermissionLevel: typeof import('./utils/getLabelForPermissionLevel.js').getLabelForPermissionLevel;
}

declare module 'studiocms:auth/scripts/three' {
	/**
	 * This module should be imported within a script tag.
	 * @example <script>import "studiocms:auth/scripts/three";</script>
	 */

	// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any
	const defaultExport: any;
	export default defaultExport;
}

declare module 'studiocms:auth/scripts/formListener' {
	export const formListener: typeof import('./scripts/formListener.js').formListener;
}

declare module 'studiocms:auth/lib' {
	type Mod = import('./lib/auth/index.js').Mod;
	const mod: Mod;
	export = mod;
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

declare module 'virtual:studiocms/plugins/renderers' {}

declare module 'studiocms:renderer' {
	export const StudioCMSRenderer: typeof import('./components/Renderer.astro').default;
}

declare module 'virtual:studiocms/sdk/env' {
	export const dbUrl: string;
	export const dbSecret: string;
	export const cmsEncryptionKey: string;
}

declare module 'virtual:studiocms/sitemaps' {
	export const sitemaps: string[];
}

declare module 'studiocms:plugins/imageService' {
	export const imageServiceKeys: {
		identifier: string;
		safe: string;
	}[];
}

declare module 'studiocms:plugins/auth/providers' {
	export type OAuthButtons = {
		enabled: boolean;
		safeName: string;
		label: string;
		image: string;
	}[];

	/**
	 * An array of objects representing OAuth provider buttons.
	 *
	 * Each object in the array contains:
	 * - `enabled`: Indicates if the OAuth button is active.
	 * - `safeName`: A safe, unique identifier for the OAuth provider.
	 * - `label`: The display label for the OAuth button.
	 * - `image`: The URL or path to the provider's logo image.
	 */
	export const oAuthButtons: OAuthButtons;

	export type OAuthProviders = {
		safeName: string;
		enabled: boolean;
		initSession: import('astro').APIRoute | null;
		initCallback: import('astro').APIRoute | null;
	}[];

	/**
	 * An array of OAuth provider configurations.
	 *
	 * Each object in the array represents a single OAuth provider and contains:
	 * - `safeName`: A string representing a safe, unique identifier for the provider.
	 * - `enabled`: A boolean indicating whether the provider is enabled.
	 * - `initSession`: An Astro API route handler for initiating the OAuth session.
	 * - `initCallback`: An Astro API route handler for handling the OAuth callback.
	 */
	export const oAuthProviders: OAuthProviders;
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
