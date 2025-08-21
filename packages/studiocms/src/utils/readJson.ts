import fs from 'node:fs';
import { jsonParse } from './jsonParse.js';

export function readJson<T extends object>(path: string | URL): T {
	return jsonParse<T>(fs.readFileSync(path, 'utf-8'));
}
