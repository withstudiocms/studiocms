import type { AstroGlobal } from 'astro';
declare const uiTranslations: {
    readonly 'en-us': {
        default: {
            displayName: string;
            translations: {
                "@studiocms/auth:login": {
                    title: string;
                    description: string;
                    header: string;
                    "sub-header-usernamepasswordoauth": string;
                    "sub-header-usernamepassword": string;
                    "sub-header-oauth": string;
                    "sub-header-noprovider": string;
                    "username-label": string;
                    "password-label": string;
                    "login-button": string;
                    "allow-registration-noaccount": string;
                    "allow-registration-register": string;
                };
                "@studiocms/auth:signup": {
                    title: string;
                    description: string;
                    header: string;
                    "sub-header-usernamepasswordoauth": string;
                    "sub-header-usernamepassword": string;
                    "sub-header-oauth": string;
                    "sub-header-noprovider": string;
                    "username-label": string;
                    "email-label": string;
                    "displayname-label": string;
                    "password-label": string;
                    "confirm-password-label": string;
                    "create-account-button": string;
                    "allow-login-haveaccount": string;
                    "allow-login-login": string;
                };
                "@studiocms/auth:logout": {
                    title: string;
                    description: string;
                };
                "@studiocms/auth:oauth-stack": {
                    "or-login-with": string;
                };
                "@studiocms/dashboard:index": {
                    title: string;
                    "welcome-title": string;
                    "title-button:discord": string;
                    "title-button:feedback": string;
                    "sub-header": string;
                };
                "@studiocms/dashboard:sidebar": {
                    "category-1-header": string;
                    "dashboard-link-label": string;
                    "content-management-label": string;
                    "category-2-header": string;
                    "site-configuration-label": string;
                    "user-management-label": string;
                    "category-3-header": string;
                    "category-3-empty-placeholder": string;
                    "user-dropdown:settings": string;
                    "user-dropdown:view-site": string;
                    "user-dropdown:logout": string;
                };
            };
        };
        displayName: string;
        translations: {
            "@studiocms/auth:login": {
                title: string;
                description: string;
                header: string;
                "sub-header-usernamepasswordoauth": string;
                "sub-header-usernamepassword": string;
                "sub-header-oauth": string;
                "sub-header-noprovider": string;
                "username-label": string;
                "password-label": string;
                "login-button": string;
                "allow-registration-noaccount": string;
                "allow-registration-register": string;
            };
            "@studiocms/auth:signup": {
                title: string;
                description: string;
                header: string;
                "sub-header-usernamepasswordoauth": string;
                "sub-header-usernamepassword": string;
                "sub-header-oauth": string;
                "sub-header-noprovider": string;
                "username-label": string;
                "email-label": string;
                "displayname-label": string;
                "password-label": string;
                "confirm-password-label": string;
                "create-account-button": string;
                "allow-login-haveaccount": string;
                "allow-login-login": string;
            };
            "@studiocms/auth:logout": {
                title: string;
                description: string;
            };
            "@studiocms/auth:oauth-stack": {
                "or-login-with": string;
            };
            "@studiocms/dashboard:index": {
                title: string;
                "welcome-title": string;
                "title-button:discord": string;
                "title-button:feedback": string;
                "sub-header": string;
            };
            "@studiocms/dashboard:sidebar": {
                "category-1-header": string;
                "dashboard-link-label": string;
                "content-management-label": string;
                "category-2-header": string;
                "site-configuration-label": string;
                "user-management-label": string;
                "category-3-header": string;
                "category-3-empty-placeholder": string;
                "user-dropdown:settings": string;
                "user-dropdown:view-site": string;
                "user-dropdown:logout": string;
            };
        };
    };
};
/**
 * Represents the type of UI translations.
 * This type is derived from the structure of the `uiTranslations` object.
 */
export type UiTranslations = typeof uiTranslations;
/**
 * Represents the keys of the UiTranslations type.
 * This type is used to define the possible keys for UI language translations.
 */
export type UiLanguageKeys = keyof UiTranslations;
/**
 * Represents the keys of the UI component translations for the 'en-us' locale.
 * This type is derived from the 'translations' property of the 'UiTranslations' interface
 * for the 'en-us' locale (Source of truth), ensuring that only valid translation keys are used.
 */
export type UiComponentKeys = keyof UiTranslations['en-us']['translations'];
type UiTranslationComponent<L extends UiLanguageKeys, T extends UiComponentKeys> = (typeof uiTranslations)[L]['translations'][T];
type UiTranslationKey<L extends UiLanguageKeys, T extends UiComponentKeys> = keyof UiTranslationComponent<L, T>;
/**
 * Retrieves a translation function for a given language and component.
 *
 * @param lang - The language key to use for translations.
 * @param component - The component key to use for translations.
 * @returns A function that takes a translation key and returns the corresponding translated string.
 */
export declare function useTranslations<L extends UiLanguageKeys, T extends UiComponentKeys>(lang: L, component: T): (key: UiTranslationKey<L, T>) => UiTranslationComponent<L, T>[UiTranslationKey<L, T>];
/**
 * Returns a function that translates a given path based on the provided language.
 *
 * @param lang - The language key to be used for translation.
 * @returns A function that takes a path and an optional language key, and returns the translated path.
 * If the language key is not provided, the default language key is used.
 * If the language is the default language and `showDefaultLang` is false, the original path is returned.
 * Otherwise, the path is prefixed with the language key.
 */
export declare function useTranslatedPath(lang: UiLanguageKeys): (path: string, l?: string) => string;
/**
 * Generates an array of language selector options from the `uiTranslations` object.
 * Each option contains a `key` and a `value` where:
 * - `key` is a language key from `UiLanguageKeys`.
 * - `value` is the display name of the language.
 *
 * @returns An array of objects representing language selector options.
 */
export declare const languageSelectorOptions: {
    key: UiLanguageKeys;
    value: string;
}[];
/**
 * Extracts the language key from the given URL's pathname.
 *
 * @param url - The URL object from which to extract the language key.
 * @returns The language key if it exists in the `uiTranslations`, otherwise returns the default language key.
 */
export declare function getLangFromUrl(url: URL): "en-us";
/**
 * Retrieves the current URL path, adjusting for language settings.
 *
 * This function checks if the URL path includes '/_server-islands'. If it does,
 * it extracts the referer URL from the request headers and determines the current
 * language from that URL. If the current language is the default language, it returns
 * the pathname as is. Otherwise, it replaces the language segment in the pathname with '/'.
 *
 * If the URL path does not include '/_server-islands', it uses the Astro URL directly
 * to determine the current language and adjust the pathname accordingly.
 *
 * @param {AstroGlobal} Astro - The global Astro object containing URL and request information.
 */
export declare function getCurrentURLPath(Astro: AstroGlobal): string;
/**
 * Function to switch the language of the current page.
 *
 * @param {AstroGlobal} Astro - The global Astro object.
 */
export declare function switchLanguage(Astro: AstroGlobal): (languageKey: UiLanguageKeys) => string;
/**
 * Example of how to use this i18n utils on a Static page
 *
 * @example
 * ```ts
 * export async function getStaticPaths() {
 *	const paths = staticPaths();
 *	return paths;
 * }
 * ```
 *
 * If the default language is hidden, the paths for the default language will be generated without the language prefix while all extra languages will have the prefix. (e.g. When `showDefaultLang` is false: `/en/page` will be `/page` and spanish will be `/es/page`)
 *
 * @returns An array of paths for all languages
 */
export declare const staticPaths: () => {
    params: {
        locale: string | undefined;
    };
}[];
export {};
