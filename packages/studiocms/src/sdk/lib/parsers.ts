import { jsonParse } from '../../utils/jsonParse.js';
import type { DiffReturnType, diffItem, diffReturn, tsPageDataSelect } from '../types/index.js';

/**
 * Parses an unknown input and casts it to an array of numbers.
 *
 * @param ids - The input to be parsed, expected to be an array of numbers.
 * @returns An array of numbers.
 */
export function parseIdNumberArray(ids: unknown): number[] {
	return ids as number[];
}

/**
 * Parses the given input as an array of strings.
 *
 * @param ids - The input to be parsed, expected to be an array of unknown type.
 * @returns An array of strings parsed from the input.
 */
export function parseIdStringArray(ids: unknown): string[] {
	return ids as string[];
}

export function fixDiff<T extends diffItem | diffItem[]>(items: T): DiffReturnType<T> {
	if (Array.isArray(items)) {
		const toReturn: diffReturn[] = [];
		for (const { pageMetaData, ...rest } of items) {
			toReturn.push({
				...rest,
				pageMetaData: jsonParse<{
					start: Partial<tsPageDataSelect>;
					end: Partial<tsPageDataSelect>;
				}>(pageMetaData as string),
			});
		}
		return toReturn as DiffReturnType<T>;
	}

	return {
		...items,
		pageMetaData: jsonParse<{
			start: Partial<tsPageDataSelect>;
			end: Partial<tsPageDataSelect>;
		}>(items.pageMetaData as string),
	} as DiffReturnType<T>;
}
