/**
 * The UI translations available in the StudioCMS app.
 */
export const uiTranslationsAvailable = ['en', 'de', 'es', 'fr'] as const;

/**
 * The UI translations available in the StudioCMS app.
 */
export type UiTranslationKey = (typeof uiTranslationsAvailable)[number];

/**
 * The default language for the StudioCMS app.
 */
export const defaultLang: UiTranslationKey = 'en';

/**
 * Whether to show the default language in the language switcher.
 */
export const showDefaultLang: boolean = false;
