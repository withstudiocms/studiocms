import fs from 'node:fs';

export default function readJson<T>(path: string | URL): T {
	return JSON.parse(fs.readFileSync(path, 'utf-8'));
}
