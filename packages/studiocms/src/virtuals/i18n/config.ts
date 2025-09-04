/**
 * This module handles the internationalization (i18n) config for the StudioCMS application for both the Client and Server sides.
 */

import { availableTranslations } from 'studiocms:i18n/virtual';

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
 * Represents a translation entry in JSON format.
 * Can be either a string (a translated value) or a nested object of translations.
 * This allows for both flat and hierarchical translation structures.
 */
export type TranslationJSON = string | TranslationsJSON;

/**
 * The UI translations available in the StudioCMS app.
 */
export type UiTranslationKey = string;

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
 * Represents an option for selecting a language in the UI.
 *
 * @property key - The translation key associated with the language option.
 * @property value - The display value for the language option.
 */
export interface LanguageSelectorOption {
	readonly key: UiTranslationKey;
	readonly value: string;
}

/**
 * An object containing server-side UI translations for supported locales.
 *
 * - The `en` property provides the base server translations for English.
 * - Additional locale translations are spread from `nonBaseTranslations`.
 *
 * @remarks
 * This constant is typed as `ServerUiTranslations` and marked as `const` for immutability.
 */
export const serverUiTranslations: ServerUiTranslations = {
	en: baseServerTranslations,
	...availableTranslations,
};

/**
 * The UI translations available in the StudioCMS app.
 */
export const uiTranslationsAvailable = Object.keys(serverUiTranslations) as UiTranslationKey[];

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
 * The default language for the StudioCMS app.
 */
export const defaultLang: UiTranslationKey = 'en';

/**
 * Whether to show the default language in the url path.
 */
export const showDefaultLang: boolean = false;

/**
 * Generates an array of language selector options from the available server UI translations.
 * Each option contains a `key` representing the language code and a `value` representing the display name of the language.
 *
 * @remarks
 * This is typically used to populate language selection dropdowns in the UI.
 *
 * @returns An array of objects, each with `key` and `value` properties for language selection.
 */
export const languageSelectorOptions: LanguageSelectorOption[] = Object.keys(serverUiTranslations)
	.map((key) => {
		const displayName = serverUiTranslations[key]?.displayName;
		const value = typeof displayName === 'string' && displayName.trim() ? displayName : String(key);
		return { key: key as UiTranslationKey, value };
	})
	.sort((a, b) => a.value.localeCompare(b.value, undefined, { sensitivity: 'base' }));
