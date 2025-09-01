import { availableTranslationFileKeys } from 'studiocms:i18n/virtual';

/**
 * Dynamically imports a translation JSON file for the specified language.
 *
 * @param lang - The language key corresponding to the translation file to import.
 * @returns A promise that resolves to the translation record for the specified language.
 *
 * @remarks
 * This function uses dynamic import to load the translation file at runtime.
 * The import path is constructed using the provided language key.
 * The `@vite-ignore` comment is used to prevent Vite from processing the import path statically.
 * The `assert` and `with` options are used for JSON module assertion, with a note about TypeScript compatibility.
 */
const importTranslation = async (lang: UiTranslationKey): Promise<StudioCMSTranslationRecord> => {
	return (
		await import(/* @vite-ignore */ `./translations/${lang}.json`, {
			// @ts-ignore - assert is deprecated in newer versions of TypeScript
			assert: { type: 'json' },
			with: { type: 'json' },
		})
	).default;
};

/**
 * Dynamically imports the base English translations for server-side internationalization.
 *
 * @remarks
 * This constant loads the default English translation JSON file asynchronously at runtime.
 * It is intended to be used as the base set of translations for the server.
 *
 * - These translations are also converted to a client-friendly format.
 */
export const baseServerTranslations = (
	await import('./translations/en.json', {
		assert: { type: 'json' },
	})
).default;

/**
 * Represents a translation record for StudioCMS.
 *
 * @property displayName - The human-readable name for the translation.
 * @property translations - The translation data in the form of a ComponentsJSON object.
 */
export type StudioCMSTranslationRecord = typeof baseServerTranslations;

/**
 * An object containing server-side UI translations for supported languages.
 *
 * Each property corresponds to a language code (e.g., 'en', 'de', 'es', 'fr') and dynamically imports
 * the respective translation JSON file at runtime.
 *
 * @remarks
 * The imported translation files are loaded asynchronously using `await import()`.
 *
 * @type {ServerUiTranslations}
 * @readonly
 */
export const serverUiTranslations: ServerUiTranslations = {
	en: baseServerTranslations,
	...Object.fromEntries(
		await Promise.all(
			availableTranslationFileKeys
				.filter((lang) => lang !== 'en') // Exclude English from dynamic imports as it is already included
				.map(async (lang) => [lang, await importTranslation(lang)])
		)
	),
} as const;

/**
 * Transforms the `serverUiTranslations` object into a `ClientUiTranslations` object
 * by extracting only the `translations` property for each UI translation key.
 *
 * @remarks
 * This reduces the server-side translation structure to a client-friendly format,
 * mapping each `UiTranslationKey` to its corresponding translations object.
 *
 * @type {ClientUiTranslations}
 */
export const clientUiTranslations: ClientUiTranslations = Object.entries(
	serverUiTranslations
).reduce((acc, [key, value]) => {
	acc[key as UiTranslationKey] = value.translations;
	return acc;
}, {} as ClientUiTranslations);

/**
 * The UI translations available in the StudioCMS app.
 */
export type UiTranslationKey = string;

/**
 * The default language for the StudioCMS app.
 */
export const defaultLang: UiTranslationKey = 'en';

/**
 * Whether to show the default language in the url path.
 */
export const showDefaultLang: boolean = false;

/**
 * Represents a translation entry in JSON format.
 * Can be either a string (a translated value) or a nested object of translations.
 * This allows for both flat and hierarchical translation structures.
 */
export type TranslationJSON = string | TranslationsJSON;

/**
 * Represents a collection of translation entries, where each key is a locale or identifier,
 * and the value is a `TranslationJSON` object containing the translations for that key.
 *
 * @remarks
 * This interface is typically used to store or retrieve multiple sets of translations,
 * organized by language or context.
 *
 * @example
 * ```typescript
 * const translations: TranslationsJSON = {
 *   en: { greeting: "Hello" },
 *   fr: { greeting: "Bonjour" }
 * };
 * ```
 */
export interface TranslationsJSON {
	[key: string]: TranslationJSON;
}

/**
 * Represents a mapping of component names to their respective translation objects.
 *
 * @remarks
 * Each key in the object is a component name (as a string), and the value is a `TranslationsJSON`
 * object containing the translations for that component.
 *
 * @example
 * ```typescript
 * const components: ComponentsJSON = {
 *   header: { en: "Header", fr: "En-tête" },
 *   footer: { en: "Footer", fr: "Pied de page" }
 * };
 * ```
 */
export type ComponentsJSON = StudioCMSTranslationRecord['translations'];

/**
 * Represents the server-side UI translations.
 *
 * This type maps each `UiTranslationKey` to its corresponding `StudioCMSTranslationRecord`,
 * allowing for structured access to translation records for different UI elements.
 *
 * @see UiTranslationKey
 * @see StudioCMSTranslationRecord
 */
export type ServerUiTranslations = Record<UiTranslationKey, StudioCMSTranslationRecord>;

/**
 * Represents a mapping of UI translation keys to their corresponding component translation JSON objects.
 *
 * @typeParam UiTranslationKey - The set of valid keys for UI translations.
 * @typeParam ComponentsJSON - The shape of the translation data for each component.
 */
export type ClientUiTranslations = Record<UiTranslationKey, ComponentsJSON>;

/**
 * The UI translations available in the StudioCMS app.
 */
export const uiTranslationsAvailable = Object.keys(serverUiTranslations) as UiTranslationKey[];
