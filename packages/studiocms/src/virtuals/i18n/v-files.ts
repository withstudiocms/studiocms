/**
 * This file is responsible for managing translation files.
 *
 * It provides utilities to work with translation keys and their corresponding
 * file paths.
 *
 * Note: The exported function is imported and used by the main index of the integration,
 * to generate the list of available translation keys and inject them into a server/client
 * friendly Vite virtual module.
 *
 * If you are interested in contributing to the translation effort, please visit our Crowdin project:
 * https://crowdin.com/project/studiocms or submit a pull request to the `translations` folder:
 * `packages/studiocms/src/virtuals/i18n/translations/` on https://github.com/withstudiocms/studiocms
 */

import type { LanguageFlagIdentifier, ServerUiTranslations } from './config.js';
import { translationFlagKeyOverrides } from './overrides.js';

/**
 * Dynamically imports the base English translations for server-side internationalization.
 *
 * @remarks
 * This constant loads the default English translation JSON file asynchronously at runtime.
 * It is intended to be used as the base set of translations for the server.
 *
 * - These translations are also converted to a client-friendly format.
 */
export const baseServerTranslations = (await import('./translations/en.json')).default;

/**
 * Represents a translation record for StudioCMS.
 *
 * @property displayName - The human-readable name for the translation.
 * @property translations - The translation data in the form of a ComponentsJSON object.
 */
export type StudioCMSTranslationRecord = typeof baseServerTranslations;

/**
 * A record mapping translation file keys (e.g., 'en', 'fr') to their corresponding translation data.
 */
export const translationFiles: Record<string, StudioCMSTranslationRecord> = {
	// Base translations
	en: baseServerTranslations,

	// Additional translations can be added here
	de: (await import('./translations/de.json')).default,
	es: (await import('./translations/es.json')).default,
	fr: (await import('./translations/fr.json')).default,
	// @ts-expect-error There is a type mismatch in the Hindi translation file. (likely out of sync with the base definition)
	hi: (await import('./translations/hi.json')).default,
	nl: (await import('./translations/nl.json')).default,
	no: (await import('./translations/no.json')).default,
	zh: (await import('./translations/zh.json')).default,
};

/**
 * An array of translation file keys derived from `availableTranslationFiles`.
 *
 * @example
 * // availableTranslationFileKeys = ['en', 'fr']
 */
export const availableTranslationFileKeys = Object.keys(translationFiles);

/**
 * Recursively checks a record object for string values and counts the total number of strings
 * and the number of empty strings (strings that are empty or contain only whitespace).
 *
 * @param record - The object to check, which may contain nested objects and string values.
 * @returns An object containing:
 *   - `count`: The total number of string values found.
 *   - `emptyStrings`: The number of string values that are empty or contain only whitespace.
 */
export function checkStrings(record: unknown): { count: number; emptyStrings: number } {
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

const MISSING_RATIO_THRESHOLD = 0.1 as const; // 10%

/**
 * Checks whether the ratio of empty strings to total strings in a translation file
 * is within an acceptable threshold.
 *
 * @param opt - An object containing:
 *   - `count`: The total number of strings in the translation file.
 *   - `emptyStrings`: The number of empty strings in the translation file.
 * @returns `true` if the ratio of empty strings is less than or equal to 10%, otherwise `false`.
 */
export function checkThreshold(opt: { count: number; emptyStrings: number }) {
	const threshold = MISSING_RATIO_THRESHOLD;
	if (opt.count === 0) return false;
	return opt.emptyStrings / opt.count <= threshold;
}

export const buildAvailableTranslations = (
	availableKeys: string[],
	translationFiles: Record<string, StudioCMSTranslationRecord>
) => {
	const results: Record<string, StudioCMSTranslationRecord> = {};

	for (const key of availableKeys) {
		const translation = translationFiles[key];
		const result = checkStrings(translation);
		if (!checkThreshold(result)) continue;
		results[key] = translation;
	}

	return results;
};

/**
 * Loads and returns the available server-side UI translations, excluding English ('en').
 * For each translation file key, reads the corresponding JSON file, checks its string values,
 * and includes it in the results only if it passes the threshold check.
 * Skips translation files with too many empty strings and logs a warning.
 *
 * @returns {ServerUiTranslations} An object mapping language keys to their translation records.
 */
export const availableTranslations: ServerUiTranslations = (() =>
	buildAvailableTranslations(
		availableTranslationFileKeys.filter((key) => key !== 'en'),
		translationFiles
	))();

/**
 * Restored Available Translations which includes the default
 * english translation key for usage generating the language flags
 */
export const availableTranslationsKeys = ['en', ...Object.keys(availableTranslations)];

/**
 * An array of language flags derived from `availableTranslationsKeys`.
 * Each flag is generated by mapping the key to a corresponding icon from
 * the `@iconify-json/circle-flags` package. And allows overriding default flags
 * using the `translationFlagKeyOverrides`.
 *
 * @example
 * // If availableTranslationsKeys = ['en', 'fr']
 * // langFlags = [{ key: 'en', flag: 'lang-en-us' }, { key: 'fr', flag: 'lang-fr' }]
 */
export const currentFlags: Array<{ key: string; flag: LanguageFlagIdentifier }> =
	availableTranslationsKeys.map((key) => {
		const flagKey: LanguageFlagIdentifier = translationFlagKeyOverrides[key] || `lang-${key}`;
		return { key, flag: flagKey };
	});
