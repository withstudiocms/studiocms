/**
 * Converts the first character of a given string to uppercase while keeping the rest of the string unchanged.
 *
 * @param text - The input string to be transformed.
 * @returns A new string with the first character converted to uppercase. If the input string has a length of 1 or less, it is returned unchanged.
 */
export function firstUpperCase(text: string): string {
	if (text.length > 1) {
		const p1 = text.slice(0, 1);
		const p2 = text.slice(1);
		return `${p1.toUpperCase()}${p2}`;
	}
	return text;
}

/**
 * Parses a JSON string into a strongly-typed object.
 *
 * @template T - The type of the object to parse the JSON string into.
 * @param data - The JSON string to be parsed.
 * @returns The parsed object of type `T`.
 * @throws {SyntaxError} If the input string is not valid JSON.
 */
export function parse<T extends object>(data: string): T {
	return JSON.parse(data) as T;
}
