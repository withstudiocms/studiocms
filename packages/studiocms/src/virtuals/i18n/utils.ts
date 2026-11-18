export interface TranslationRecord {
	[x: string]: {
		displayName: string;
		translations: Record<string, Record<string, string>>;
	};
}

export type LanguageFlagIdentifier = `lang-${string}` | string;

/**
 * Builds a record of available translations that pass the threshold check.
 *
 * @param availableKeys - An array of available translation file keys.
 * @param translationFiles - A record mapping translation file keys to their corresponding translation records.
 * @returns A record of translation file keys to their translation records that pass the threshold check.
 */
export const buildAvailableTranslations = (
	availableKeys: string[],
	translationFiles: TranslationRecord
) => {
	const results: TranslationRecord = {};

	for (const key of availableKeys) {
		const translation = translationFiles[key];
		const result = checkStrings(translation);
		if (!checkThreshold(result)) continue;
		results[key] = translation;
	}

	return results;
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
