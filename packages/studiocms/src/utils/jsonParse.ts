/**
 * Parses a JSON string and returns the resulting object.
 *
 * @template T - The expected type of the parsed object.
 * @param text - The JSON string to parse.
 * @returns The parsed object of type `T`.
 * @throws {SyntaxError} If the input string is not valid JSON.
 */
export function jsonParse<T extends object>(text: string): T {
	return JSON.parse(text);
}
