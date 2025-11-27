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

declare module 'studiocms:dashboard/augments/components' {
	export const componentKeys: string[];
}

declare module 'studiocms:dashboard/augments/scripts' {}

declare module 'studiocms:components/dashboard-grid-items' {
	export const dashboardGridItems: import('./schemas/plugins/shared').GridItemUsable[];
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
		onCreate: import('./plugins').PluginAPIRoute<'onCreate'> | null;
		onEdit: import('./plugins').PluginAPIRoute<'onEdit'> | null;
		onDelete: import('./plugins').PluginAPIRoute<'onDelete'> | null;
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

declare module 'studiocms:plugins/augments' {
	export const renderAugments: import('./types.js').RenderAugment[];
}

declare module 'studiocms:mailer' {
	type Mod = typeof import('./virtuals/mailer/index');
	export const Mailer: Mod['Mailer'];

	// Table Def
	export const tsMailerConfig: import('./virtuals/mailer/index').tsMailerConfig;
	// Types
	export type tsMailer = import('./virtuals/mailer/index').tsMailer;
	export type tsMailerInsert = import('./virtuals/mailer/index').tsMailerInsert;
	export type TransporterConfig = import('./virtuals/mailer/index').TransporterConfig;
	export type MailerConfig = import('./virtuals/mailer/index').MailerConfig;
	export type MailOptions = import('./virtuals/mailer/index').MailOptions;
	export type MailerResponse = import('./virtuals/mailer/index').MailerResponse;
}

declare module 'studiocms:mailer/templates' {
	/**
	 * @deprecated Use the `templateEngine` virtual instead.
	 */
	export const getTemplate: typeof import('./virtuals/mailer/template').getTemplate;
	/**
	 * @deprecated Use the `templateEngine` virtual instead.
	 */
	export default getTemplate;
}

declare module 'studiocms:template-engine' {
	export const templateEngine: typeof import('./virtuals/template-engine/index').templateEngine;
	export default templateEngine;
}

declare module 'studiocms:notifier' {
	type Mod = typeof import('./virtuals/notifier/index');
	export const Notifications: Mod['Notifications'];

	export type UserNotification = import('./virtuals/notifier/index').UserNotification;
	export type EditorNotification = import('./virtuals/notifier/index').EditorNotification;
	export type AdminNotification = import('./virtuals/notifier/index').AdminNotification;
	export const notificationTypes: typeof import('./virtuals/notifier/index').notificationTypes;
	/**
	 * @deprecated use Translation system instead
	 */
	export const notificationTitleStrings: typeof import('./virtuals/notifier/index').notificationTitleStrings;
}

declare module 'studiocms:notifier/client' {
	export type UserNotificationOptions =
		import('./virtuals/notifier/client').UserNotificationOptions;
	export const getEnabledNotificationCheckboxes: typeof import('./virtuals/notifier/client').getEnabledNotificationCheckboxes;
	export const formatNotificationOptions: typeof import('./virtuals/notifier/client').formatNotificationOptions;
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
	export const FormattedDate: typeof import('./virtuals/components/FormattedDate.astro').default;
	export const Generator: typeof import('./virtuals/components/Generator.astro').default;
}

declare module 'virtual:studiocms/components/Editors' {
	export const editorKeys: string[];
}

declare module 'studiocms:i18n/config' {
	export const config: import('./schemas/config/index').StudioCMSConfig['locale']['i18n'];
	export default config;
}

declare module 'studiocms:i18n/virtual' {
	export const availableTranslationFileKeys: typeof import('./virtuals/i18n/v-files').availableTranslationFileKeys;
	export const availableTranslations: typeof import('./virtuals/i18n/v-files').availableTranslations;
	export const currentFlags: typeof import('./virtuals/i18n/v-files').currentFlags;
}

declare module 'studiocms:i18n' {
	export type UiLanguageKeys = import('./virtuals/i18n/server').UiLanguageKeys;
	export type UiTranslations = import('./virtuals/i18n/server').UiTranslations;
	export const staticPaths: typeof import('./virtuals/i18n/server').staticPaths;
	export const getLangFromUrl: typeof import('./virtuals/i18n/server').getLangFromUrl;
	export const useTranslations: typeof import('./virtuals/i18n/server').useTranslations;
	export const useTranslatedPath: typeof import('./virtuals/i18n/server').useTranslatedPath;
	export const getCurrentURLPath: typeof import('./virtuals/i18n/server').getCurrentURLPath;
	export const switchLanguage: typeof import('./virtuals/i18n/server').switchLanguage;
	export const defaultLang: typeof import('./virtuals/i18n/server').defaultLang;
	export const LanguageSelector: typeof import('./virtuals/i18n/LanguageSelector.astro').default;
}

declare module 'studiocms:i18n/client' {
	export type UiTranslationKey = import('./virtuals/i18n/client').UiTranslationKey;
	export const $localeSettings: typeof import('./virtuals/i18n/client').$localeSettings;
	export const $locale: typeof import('./virtuals/i18n/client').$locale;
	export const format: typeof import('./virtuals/i18n/client').format;
	export const $i18n: typeof import('./virtuals/i18n/client').$i18n;
	export const baseTranslation: typeof import('./virtuals/i18n/client').baseTranslation;
	export const documentUpdater: typeof import('./virtuals/i18n/client').documentUpdater;
	export const makeTranslation: typeof import('./virtuals/i18n/client').makeTranslation;
	export const updateElmLabel: typeof import('./virtuals/i18n/client').updateElmLabel;
	export const defaultLang: typeof import('./virtuals/i18n/client').defaultLang;
	export const uiTranslationsAvailable: typeof import('./virtuals/i18n/client').uiTranslationsAvailable;
	export const pageHeaderUpdater: typeof import('./virtuals/i18n/client').pageHeaderUpdater;
	export const updateSelectElmLabel: typeof import('./virtuals/i18n/client').updateSelectElmLabel;
	export const updateElmPlaceholder: typeof import('./virtuals/i18n/client').updateElmPlaceholder;
	export const updateToggleElmLabel: typeof import('./virtuals/i18n/client').updateToggleElmLabel;
	export const updateTabLabel: typeof import('./virtuals/i18n/client').updateTabLabel;
	export const updateTrueFalseSelectOptions: typeof import('./virtuals/i18n/client').updateTrueFalseSelectOptions;
	export const updateSelectOptions: typeof import('./virtuals/i18n/client').updateSelectOptions;
}

declare module 'studiocms:i18n/plugin-translations' {
	const pluginTranslations: import('./schemas/plugins/i18n').PluginTranslationCollection;
	export default pluginTranslations;
}

declare module 'studiocms:i18n/augment-translations' {
	const augmentTranslations: import('./schemas/plugins/i18n').PluginAugmentsTranslationCollection;
	export default augmentTranslations;
}

declare module 'studiocms:i18n/plugins' {
	export declare class PluginTranslations extends HTMLElement {
		currentLang: string | undefined;
		constructor();
		connectedCallback(): void;
	}
	export const $pluginI18n: typeof import('./virtuals/i18n/plugin').$pluginI18n;
	export const $augmentI18n: typeof import('./virtuals/i18n/plugin').$augmentI18n;
}

declare module 'studiocms:imageHandler/components' {
	export const CustomImage: typeof import('./virtuals/components/CustomImage.astro').default;
}

declare module 'studiocms:lib' {
	export const HeadConfigSchema: typeof import('./virtuals/lib/head.js').HeadConfigSchema;
	export const createHead: typeof import('./virtuals/lib/head.js').createHead;
	export const headDefaults: typeof import('./virtuals/lib/headDefaults.js').headDefaults;
	export const pathWithBase: typeof import('./virtuals/lib/pathGenerators.js').pathWithBase;
	export const fileWithBase: typeof import('./virtuals/lib/pathGenerators.js').fileWithBase;
	export const ensureLeadingSlash: typeof import('./virtuals/lib/pathGenerators.js').ensureLeadingSlash;
	export const ensureTrailingSlash: typeof import('./virtuals/lib/pathGenerators.js').ensureTrailingSlash;
	export const stripLeadingSlash: typeof import('./virtuals/lib/pathGenerators.js').stripLeadingSlash;
	export const stripTrailingSlash: typeof import('./virtuals/lib/pathGenerators.js').stripTrailingSlash;
	export const stripHtmlExtension: typeof import('./virtuals/lib/pathGenerators.js').stripHtmlExtension;
	export const ensureHtmlExtension: typeof import('./virtuals/lib/pathGenerators.js').ensureHtmlExtension;
	export const stripLeadingAndTrailingSlashes: typeof import('./virtuals/lib/pathGenerators.js').stripLeadingAndTrailingSlashes;
	export const getSluggedRoute: typeof import('./virtuals/lib/routeMap.js').getSluggedRoute;
	export const getEditRoute: typeof import('./virtuals/lib/routeMap.js').getEditRoute;
	export const getDeleteRoute: typeof import('./virtuals/lib/routeMap.js').getDeleteRoute;
	export const makeNonDashboardRoute: typeof import('./virtuals/lib/routeMap.js').makeNonDashboardRoute;
	export const makeDashboardRoute: typeof import('./virtuals/lib/routeMap.js').makeDashboardRoute;
	export const StudioCMSRoutes: typeof import('./virtuals/lib/routeMap.js').StudioCMSRoutes;
	export const urlGenFactory: typeof import('./virtuals/lib/urlGen.js').default;

	export type HeadConfig = import('./virtuals/lib/head.js').HeadConfig;
	export type HeadUserConfig = import('./virtuals/lib/head.js').HeadUserConfig;
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

	export const getPluginDashboardPages: typeof import('./virtuals/plugins/index.js').getPluginDashboardPages;
	export const frontendNavigation: typeof import('./virtuals/plugins/index.js').frontendNavigation;
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
	export const componentProps: import('@withstudiocms/component-registry/types').ComponentRegistryEntry[];
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
		import('@withstudiocms/component-registry/runtime').ComponentRegistryEntry;

	/**
	 * Imports components by their keys from the 'studiocms:markdown-remark/user-components' module.
	 *
	 * @param keys - An array of strings representing the keys of the components to import.
	 * @returns A promise that resolves to an object containing the imported components.
	 * @throws {MarkdownRemarkError} If any component fails to import, an error is thrown with a prefixed message.
	 * @deprecated This function is deprecated and will be removed in future versions.
	 * Use `getRendererComponents` instead for importing components from the component registry.
	 */
	export const importComponentsKeys: typeof import('@withstudiocms/component-registry/runtime').importComponentsKeys;

	/**
	 * @returns A promise that resolves to an object containing the imported components.
	 */
	export const getRendererComponents: typeof import('@withstudiocms/component-registry/runtime').getRendererComponents;

	/**
	 * Returns the component registry entries.
	 *
	 * @returns {ComponentRegistryEntry[]} An object mapping safe component names to their registry entries.
	 */
	export const getRegistryComponents: typeof import('@withstudiocms/component-registry/runtime').getRegistryComponents;

	/**
	 * List of component properties that are registered in the component registry.
	 *
	 * Each entry in the array is an object with a `name` and `props` property.
	 * The `props` property is an array of objects representing the properties of the component.
	 */
	export const componentProps: import('@withstudiocms/component-registry/runtime').ComponentRegistryEntry[];

	/**
	 * Converts all underscores in a given string to hyphens.
	 *
	 * @param str - The input string containing underscores to be converted.
	 * @returns A new string with all underscores replaced by hyphens.
	 */
	export const convertUnderscoresToHyphens: typeof import('@withstudiocms/component-registry/runtime').convertUnderscoresToHyphens;
	/**
	 * Converts all hyphens in a given string to underscores.
	 *
	 * @param str - The input string containing hyphens to be converted.
	 * @returns A new string with all hyphens replaced by underscores.
	 */
	export const convertHyphensToUnderscores: typeof import('@withstudiocms/component-registry/runtime').convertHyphensToUnderscores;

	export const setupRendererComponentProxy: typeof import('@withstudiocms/component-registry/runtime').setupRendererComponentProxy;

	export const createRenderer: typeof import('@withstudiocms/component-registry/runtime').createRenderer;
}

declare module 'studiocms:sdk' {
	type Mod = typeof import('./virtuals/sdk/index.js');

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
	// ===============================================================
	// Table Type Aliases
	// ===============================================================

	export type tsPageDataCategories = import('./virtuals/sdk/types').tsPageDataCategories;
	export type tsPageDataTags = import('./virtuals/sdk/types').tsPageDataTags;
	export type tsPageData = import('./virtuals/sdk/types').tsPageData;
	export type tsPageContent = import('./virtuals/sdk/types').tsPageContent;
	export type tsSiteConfig = import('./virtuals/sdk/types').tsSiteConfig;
	export type tsUsers = import('./virtuals/sdk/types').tsUsers;
	export type tsPageFolder = import('./virtuals/sdk/types').tsPageFolder;
	export type tsAPIKeys = import('./virtuals/sdk/types').tsAPIKeys;
	export type tsDiffTracking = import('./virtuals/sdk/types').tsDiffTracking;
	export type tsEmailVerificationTokens = import('./virtuals/sdk/types').tsEmailVerificationTokens;
	export type tsOAuthAccounts = import('./virtuals/sdk/types').tsOAuthAccounts;
	export type tsPermissions = import('./virtuals/sdk/types').tsPermissions;
	export type tsPluginData = import('./virtuals/sdk/types').tsPluginData;
	export type tsSessionTable = import('./virtuals/sdk/types').tsSessionTable;
	export type tsUserResetTokens = import('./virtuals/sdk/types').tsUserResetTokens;
	export type tsPageDataCategoriesSelect = tsPageDataCategories['Select']['Type'];
	export type tsPageDataTagsSelect = tsPageDataTags['Select']['Type'];
	export type tsPageContentSelect = tsPageContent['Select']['Type'];
	export type tsUsersSelect = tsUsers['Select']['Type'];
	export type tsPageFolderSelect = tsPageFolder['Select']['Type'];
	export type tsPageDataSelect = tsPageData['Select']['Type'];
	export type tsOAuthAccountsSelect = tsOAuthAccounts['Select']['Type'];
	export type tsPermissionsSelect = tsPermissions['Select']['Type'];

	// ===============================================================
	// SDK Types
	// ===============================================================

	export type CombinedInsertContent = import('./virtuals/sdk/types').CombinedInsertContent;
	export type CombinedUserData = import('./virtuals/sdk/types').CombinedUserData;
	export type PageDataStripped = import('./virtuals/sdk/types').PageDataStripped;
	export type CombinedPageData = import('./virtuals/sdk/types').CombinedPageData;
	export type MetaOnlyPageData = import('./virtuals/sdk/types').MetaOnlyPageData;
	export type PageDataReturnType<T> = import('./virtuals/sdk/types').PageDataReturnType<T>;
	export type FolderNode = import('./virtuals/sdk/types').FolderNode;
	export type FolderListItem = import('./virtuals/sdk/types').FolderListItem;
	export type DbQueryFn = import('./virtuals/sdk/types').DbQueryFn;
	export type DynamicConfigEntry<T> = import('./virtuals/sdk/types').DynamicConfigEntry<T>;
	export type StudioCMSDynamicConfigBase =
		import('./virtuals/sdk/types').StudioCMSDynamicConfigBase;
	export type ConfigFinal<T> = import('./virtuals/sdk/types').ConfigFinal<T>;
	export type StudioCMSSiteConfig = import('./virtuals/sdk/types').StudioCMSSiteConfig;
	export type StudioCMSMailerConfig = import('./virtuals/sdk/types').StudioCMSMailerConfig;
	export type StudioCMSNotificationSettings =
		import('./virtuals/sdk/types').StudioCMSNotificationSettings;
	export type StudioCMSTemplateConfig = import('./virtuals/sdk/types').StudioCMSTemplateConfig;
	export type JwtHeader = import('./virtuals/sdk/types').JwtHeader;
	export type JwtPayload = import('./virtuals/sdk/types').JwtPayload;
	export type JwtVerificationResult = import('./virtuals/sdk/types').JwtVerificationResult;
	export type diffItem = import('./virtuals/sdk/types').diffItem;
	export type diffReturn = import('./virtuals/sdk/types').diffReturn;
	export type DiffReturnType<T> = import('./virtuals/sdk/types').DiffReturnType<T>;
	export type SingleRank = import('./virtuals/sdk/types').SingleRank;
	export type CombinedRank = import('./virtuals/sdk/types').CombinedRank;
	export type AvailableLists = import('./virtuals/sdk/types').AvailableLists;
	export type AuthErrorTags = import('./virtuals/sdk/types').AuthErrorTags;
	export type AuthDeletionData = import('./virtuals/sdk/types').AuthDeletionData;
	export type AuthDeletionResponse = import('./virtuals/sdk/types').AuthDeletionResponse;
	export type AuthErrorHandlers = import('./virtuals/sdk/types').AuthErrorHandlers;

	// ===============================================================
	// Constants
	// ===============================================================

	export const AuthErrorTagsEntries: typeof import('./virtuals/sdk/types').AuthErrorTagsEntries;
}

// declare module 'studiocms-dashboard:web-vitals' {
// 	export const getWebVitals: typeof import('./integrations/webVitals/webVital').getWebVitals;
// 	export type WebVitalsResponseItem =
// 		import('./integrations/webVitals/webVital').WebVitalsResponseItem;
// }

declare module 'studiocms:auth/utils/validImages' {
	export const validImages: typeof import('./virtuals/auth/validImages/index.js').validImages;
}

declare module 'studiocms:auth/utils/getLabelForPermissionLevel' {
	/**
	 * @deprecated Use Translation system under the `@studiocms/dashboard:user-component` entry
	 */
	export const getLabelForPermissionLevel: typeof import('./virtuals/auth/getLabelForPermissionLevel.js').getLabelForPermissionLevel;
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

declare module 'studiocms:auth/lib' {
	type Mod = import('./virtuals/auth/index.js').Mod;
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
	export type OAuthAccountsTable = import('./virtuals/auth/types.js').OAuthAccountsTable;
	/**
	 * Interface representing a table of user permissions.
	 *
	 * @interface PermissionsTable
	 * @property {string} user - The username of the individual.
	 * @property {string} rank - The rank or role assigned to the user.
	 */
	export type PermissionsTable = import('./virtuals/auth/types.js').PermissionsTable;
	/**
	 * Represents the session data for a user.
	 *
	 * @property {boolean} isLoggedIn - Indicates whether the user is logged in.
	 * @property {UserTable | null} user - The user data, or null if no user is logged in.
	 * @property {'owner' | 'admin' | 'editor' | 'visitor' | 'unknown'} permissionLevel - The permission level of the user.
	 */
	export type UserSessionData = import('./virtuals/auth/types.js').UserSessionData;
	/**
	 * Represents a user session which includes user information and session details.
	 *
	 * @property {UserTable} user - The user data.
	 * @property {SessionTable} session - The session data.
	 */
	export type UserSession = import('./virtuals/auth/types.js').UserSession;
	/**
	 * Represents the result of validating a session token.
	 *
	 * This type can either be a valid `UserSession` or an object indicating an invalid session with both `session` and `user` properties set to `null`.
	 */
	export type SessionValidationResult = import('./virtuals/auth/types.js').SessionValidationResult;
	/**
	 * Represents an individual refillable token bucket.
	 *
	 * @interface RefillBucket
	 * @property {number} count - The current token count in the bucket.
	 * @property {number} refillAt - The time at which the bucket was last refilled.
	 */
	export type RefillBucket = import('./virtuals/auth/types.js').RefillBucket;
	/**
	 * Represents a bucket with an expiration mechanism.
	 *
	 * @interface ExpiringBucket
	 * @property {number} count - The current token count in the bucket.
	 * @property {number} createdAt - The timestamp when the bucket was created.
	 */
	export type ExpiringBucket = import('./virtuals/auth/types.js').ExpiringBucket;
	/**
	 * Interface representing a throttling counter.
	 *
	 * @interface ThrottlingCounter
	 * @property {number} timeout - The duration (in milliseconds) for which the throttling is applied.
	 * @property {number} updatedAt - The timestamp (in milliseconds since epoch) when the throttling counter was last updated.
	 */
	export type ThrottlingCounter = import('./virtuals/auth/types.js').ThrottlingCounter;
}

declare module 'virtual:studiocms/plugins/renderers' {}

declare module 'studiocms:template-editor/script' {}

declare module 'studiocms:renderer' {
	export const StudioCMSRenderer: typeof import('./virtuals/components/Renderer.astro').default;
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

interface StudioCMSSecurityLocals {
	userSessionData: import('./virtuals/auth/types').UserSessionData;
	emailVerificationEnabled: boolean;
	userPermissionLevel: {
		isVisitor: boolean;
		isEditor: boolean;
		isAdmin: boolean;
		isOwner: boolean;
	};
}

interface StudioCMSPluginLocals {
	editorCSRFToken: string;
}

interface StudioCMSLocals {
	SCMSGenerator: string;
	SCMSUiGenerator: string;
	siteConfig: import('./virtuals/sdk/types').DynamicConfigEntry<
		import('./virtuals/sdk/types').StudioCMSSiteConfig
	>;
	routeMap: typeof import('./virtuals/lib/routeMap').StudioCMSRoutes;
	defaultLang: import('./virtuals/i18n/config').UiTranslationKey;
	latestVersion: {
		version: string;
		lastCacheUpdate: Date;
	};
	security?: StudioCMSSecurityLocals;
	plugins?: StudioCMSPluginLocals;
}

declare namespace App {
	interface Locals {
		StudioCMS: StudioCMSLocals;
	}
}
