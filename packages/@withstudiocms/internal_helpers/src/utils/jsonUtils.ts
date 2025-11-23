import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

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
	readFileSync: (path: string | URL, encoding: BufferEncoding) => string = fs.readFileSync
): T {
	// Convert URL objects to file paths for consistency
	const filePath = path instanceof URL ? fileURLToPath(path) : path;
	const content = readFileSync(filePath, 'utf-8');
	return jsonParse<T>(content);
}
