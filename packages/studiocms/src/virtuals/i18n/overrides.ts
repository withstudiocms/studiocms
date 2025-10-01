import type { LanguageFlagIdentifier, UiTranslationKey } from './config.js';

/**
 * Use this map to set custom keys that are not 2 character flags from:
 * https://icon-sets.iconify.design/circle-flags/?icon-filter=lang-&keyword=flag
 */
export const translationFlagKeyOverrides: Record<string, LanguageFlagIdentifier> = {
	en: 'lang-en-us',
	es: 'lang-es-mx',
} as const;

/**
 * The default language for the StudioCMS app.
 */
export const defaultLang: UiTranslationKey = 'en';
