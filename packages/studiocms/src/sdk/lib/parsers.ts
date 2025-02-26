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
