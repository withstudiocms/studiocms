import fs from 'node:fs';

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

/**
 * Reads a JSON file and parses it into an object of type T.
 */
export function readJson<T extends object>(
	path: string | URL,
	readFileSync: (
		path: fs.PathOrFileDescriptor,
		encoding: BufferEncoding
	) => string = fs.readFileSync
): T {
	const content = readFileSync(path, 'utf-8');
	return jsonParse<T>(content);
}
