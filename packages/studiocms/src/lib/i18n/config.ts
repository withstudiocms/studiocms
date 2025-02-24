export const uiTranslationsAvailable = ['en-us'] as const;

export type UiTranslationKey = (typeof uiTranslationsAvailable)[number];

// Default language - Must match one of the keys in the `ui` object above
export const defaultLang: UiTranslationKey = 'en-us';

// Show the default language in the URL (e.g. /en/page) or hide it (e.g. /page)
// This is false in Astro-feedback so there is no need for a language prefix and page redirect on the main route.
export const showDefaultLang: boolean = false;
