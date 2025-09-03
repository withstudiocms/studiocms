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
			assert: { type: 'json' },
		})
	).default;
};

/**
 * Recursively checks a record object for string values and counts the total number of strings
 * and the number of empty strings (strings that are empty or contain only whitespace).
 *
 * @param record - The object to check, which may contain nested objects and string values.
 * @returns An object containing:
 *   - `count`: The total number of string values found.
 *   - `emptyStrings`: The number of string values that are empty or contain only whitespace.
 */
function checkStrings(record: unknown): { count: number; emptyStrings: number } {
	if (typeof record !== 'object' || record === null) return { count: 0, emptyStrings: 0 };
	let count = 0;
	let emptyStrings = 0;
	for (const value of Object.values(record as Record<string, unknown>)) {
		if (typeof value === 'string') {
			count++;
			if (value.trim() === '') emptyStrings++;
		} else if (typeof value === 'object' && value !== null) {
			const { count: c, emptyStrings: e } = checkStrings(value);
			count += c;
			emptyStrings += e;
		}
	}
	return { count, emptyStrings };
}

/**
 * Checks whether the ratio of empty strings to total strings in a translation file
 * is within an acceptable threshold.
 *
 * @param opt - An object containing:
 *   - `count`: The total number of strings in the translation file.
 *   - `emptyStrings`: The number of empty strings in the translation file.
 * @returns `true` if the ratio of empty strings is less than or equal to 10%, otherwise `false`.
 */
function checkThreshold(opt: { count: number; emptyStrings: number }) {
	const threshold = 0.1; // 10% empty strings allowed
	if (opt.count === 0) return false;
	return opt.emptyStrings / opt.count <= threshold;
}

/**
 * Verifies the existence of a translation file for the given key, imports it,
 * checks its string validity, and returns the translation record if it passes
 * the threshold check. If the translation file does not meet the threshold,
 * the function returns `undefined`. If the file cannot be imported, the import
 * error is allowed to bubble to the caller.
 *
 * @param key - The key identifying the translation file to import.
 * @returns A promise that resolves to an object containing the translation record
 *          keyed by the provided key, or an empty object if the threshold check fails.
 * @throws {Error} If the translation file for the given key is not found.
 */
const verifyAndImportTranslation = async (
	key: UiTranslationKey
): Promise<StudioCMSTranslationRecord | undefined> => {
	const translationRecord = await importTranslation(key);
	const result = checkStrings(translationRecord);

	if (!checkThreshold(result)) {
		return undefined;
	}

	return translationRecord;
};

/**
 * Asynchronously retrieves a translation record for the given key.
 *
 * This function attempts to verify and import a translation associated with the provided key.
 * If a translation record is found, it returns a tuple containing the key and the translation record.
 * If no translation record is found, it returns `undefined`.
 *
 * @param key - The translation key to look up.
 * @returns A promise that resolves to a tuple of `[key, translationRecord]` if found, or `undefined` if not.
 */
async function translationMap(key: UiTranslationKey) {
	const translationRecord = await verifyAndImportTranslation(key);
	if (!translationRecord) return undefined;
	return [key, translationRecord];
}

/**
 * Filters an array of results to remove any falsy values and entries where the key is 'undefined'.
 *
 * @param results - An array of arrays containing either strings or `StudioCMSTranslationRecord` objects, or `undefined`.
 * @returns An array of `[string, StudioCMSTranslationRecord]` tuples where the key is not 'undefined'.
 */
function filterCallback(results: ((string | StudioCMSTranslationRecord)[] | undefined)[]) {
	return results
		.filter((res): res is [string, StudioCMSTranslationRecord] => !!res)
		.filter(([key]) => key !== 'undefined');
}

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
 * An array of translation file keys to fetch, excluding the default English ('en') translation.
 * Filters out the 'en' key from the list of available translation file keys.
 *
 * @example
 * // If availableTranslationFileKeys = ['en', 'fr', 'de']
 * // translationsToFetch = ['fr', 'de']
 */
const translationsToFetch = availableTranslationFileKeys.filter((key) => key !== 'en');

/**
 * An object containing translations for UI elements that are not part of the base language.
 *
 * The translations are fetched asynchronously using `translationsToFetch` and processed by `translationMap`.
 * After fetching, the results are filtered using `filterCallback` to ensure only relevant translations are included.
 *
 * @remarks
 * This is typically used to provide localized strings for languages other than the default/base language.
 *
 * @type {ServerUiTranslations}
 */
const nonBaseTranslations: ServerUiTranslations = Object.fromEntries(
	await Promise.all(translationsToFetch.map(translationMap)).then(filterCallback)
);

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
	...nonBaseTranslations,
};

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
