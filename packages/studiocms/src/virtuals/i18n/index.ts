import type { AstroGlobal } from 'astro';
import { defaultLang, serverUiTranslations, showDefaultLang } from './config.js';

// If you still want to help translate our library while we
// prepare to implement i18n, feel free to add the new translations on
// https://crowdin.com/project/studiocms or PR them into the `translations` folder:
// `packages/studiocms/src/lib/i18n/translations/` on https://github.com/withstudiocms/studiocms

// --- i18n Config --- //

/**
 * The UI translations available in the StudioCMS app.
 */
const uiTranslations = serverUiTranslations;

// Some options are stored in the `./config.ts` file.

// --- i18n Utils --- //

export { defaultLang };

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
 * Represents the keys of the UI component translations for the 'en' locale.
 * This type is derived from the 'translations' property of the 'UiTranslations' interface
 * for the 'en' locale (Source of truth), ensuring that only valid translation keys are used.
 */
export type UiComponentKeys = keyof UiTranslations['en']['translations'];

/**
 * Represents the translation type for a specific UI component key (`T`)
 * within a given language key (`L`) from the `uiTranslations` object.
 *
 * @typeParam L - The language key, constrained to `UiLanguageKeys`.
 * @typeParam T - The UI component key, constrained to `UiComponentKeys`.
 *
 * @example
 * // Get the translation type for the 'button' component in 'en' language:
 * type ButtonTranslation = UiTranslationComponent<'en', 'button'>;
 */
type UiTranslationComponent<
	L extends UiLanguageKeys,
	T extends UiComponentKeys,
> = (typeof uiTranslations)[L]['translations'][T];

/**
 * Represents the set of valid translation keys for a specific UI component and language.
 *
 * @typeParam L - The type representing the available UI language keys.
 * @typeParam T - The type representing the available UI component keys.
 *
 * This type resolves to the union of property names (keys) of the translation object
 * for the given language (`L`) and component (`T`), as defined by `UiTranslationComponent`.
 */
type UiTranslationKey<
	L extends UiLanguageKeys,
	T extends UiComponentKeys,
> = keyof UiTranslationComponent<L, T>;

/**
 * Retrieves a translation function for a given language and component.
 *
 * @param lang - The language key to use for translations.
 * @param component - The component key to use for translations.
 * @returns A function that takes a translation key and returns the corresponding translated string.
 */
export function useTranslations<L extends UiLanguageKeys, T extends UiComponentKeys>(
	lang: L,
	component: T
) {
	return function t(
		key: UiTranslationKey<L, T>
	): UiTranslationComponent<L, T>[UiTranslationKey<L, T>] {
		const maybe = uiTranslations[lang]?.translations?.[component]?.[key];
		if (maybe !== undefined) return maybe;
		// Fallback to default language; if still missing, return the key as a last resort.
		return (
			uiTranslations[defaultLang]?.translations?.[component]?.[key] ??
			(key as unknown as UiTranslationComponent<L, T>[UiTranslationKey<L, T>])
		);
	};
}

/**
 * Returns a function that translates a given path based on the provided language.
 *
 * @param lang - The language key to be used for translation.
 * @returns A function that takes a path and an optional language key, and returns the translated path.
 * If the language key is not provided, the default language key is used.
 * If the language is the default language and `showDefaultLang` is false, the original path is returned.
 * Otherwise, the path is prefixed with the language key.
 */
export function useTranslatedPath(
	lang: UiLanguageKeys
): (path: string, l?: UiLanguageKeys) => string {
	return function translatePath(path: string, l: UiLanguageKeys = lang) {
		return !showDefaultLang && l === defaultLang ? path : `/${l}${path}`;
	};
}

/**
 * Generates an array of language selector options from the `uiTranslations` object.
 * Each option contains a `key` and a `value` where:
 * - `key` is a language key from `UiLanguageKeys`.
 * - `value` is the display name of the language.
 *
 * @returns An array of objects representing language selector options.
 */
export const languageSelectorOptions = Object.keys(uiTranslations).map((key) => {
	return {
		key: key as UiLanguageKeys,
		value: uiTranslations[key as UiLanguageKeys].displayName,
	};
});

/**
 * Extracts the language key from the given URL's pathname.
 *
 * @param url - The URL object from which to extract the language key.
 * @returns The language key if it exists in the `uiTranslations`, otherwise returns the default language key.
 */
export function getLangFromUrl(url: URL) {
	const [, lang] = url.pathname.split('/');
	if (lang && lang in uiTranslations) return lang as UiLanguageKeys;
	return defaultLang;
}

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
export function getCurrentURLPath(Astro: AstroGlobal): string {
	if (Astro.url.pathname.includes('/_server-islands')) {
		const path = new URL(Astro.request.headers.get('referer') || '');
		const currentLang = getLangFromUrl(path);
		return currentLang === defaultLang
			? path.pathname
			: path.pathname.replace(`/${currentLang}/`, '/');
	}
	const path = Astro.url;
	const currentLang = getLangFromUrl(path);
	return currentLang === defaultLang
		? path.pathname
		: path.pathname.replace(`/${currentLang}/`, '/');
}

/**
 * Function to switch the language of the current page.
 *
 * @param {AstroGlobal} Astro - The global Astro object.
 */
export function switchLanguage(Astro: AstroGlobal): (languageKey: UiLanguageKeys) => string {
	return function switcher(languageKey: UiLanguageKeys) {
		const translatePath = useTranslatedPath(languageKey);
		return translatePath(getCurrentURLPath(Astro));
	};
}

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
export const staticPaths = () => {
	const paths: { params: { locale: string | undefined } }[] = [];
	if (!showDefaultLang) paths.push({ params: { locale: undefined } });
	for (const lang in uiTranslations) {
		if (lang === defaultLang && !showDefaultLang) continue;
		paths.push({ params: { locale: lang } });
	}
	return paths;
};
