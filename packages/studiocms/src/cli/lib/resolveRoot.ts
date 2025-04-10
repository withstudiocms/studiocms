import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function resolveRoot(cwd?: string | URL): string {
	let localCwd = cwd;
	if (localCwd instanceof URL) {
		localCwd = fileURLToPath(localCwd);
	}
	return localCwd ? path.resolve(localCwd) : process.cwd();
}
