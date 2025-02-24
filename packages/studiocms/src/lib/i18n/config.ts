// Note: Translations are not currently used in StudioCMS, so we
// will only allow 'en-us' to be used for now on the Dashboard.

/**
 * The UI translations available in the StudioCMS app.
 */
export const uiTranslationsAvailable = ['en-us'] as const;

/**
 * The UI translations available in the StudioCMS app.
 */
export type UiTranslationKey = (typeof uiTranslationsAvailable)[number];

/**
 * The default language for the StudioCMS app.
 */
export const defaultLang: UiTranslationKey = 'en-us';

/**
 * Whether to show the default language in the language switcher.
 */
export const showDefaultLang: boolean = false;
