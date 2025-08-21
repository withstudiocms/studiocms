import fs from 'node:fs';
import { jsonParse } from './jsonParse.js';

/**
 * Reads a JSON file and parses it into an object of type T.
 */
export function readJson<T extends object>(path: string | URL): T {
	return jsonParse<T>(fs.readFileSync(path, 'utf-8'));
}
