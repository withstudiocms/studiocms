import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveRoot(cwd?: string | URL): string {
	let CWD = cwd;
	if (CWD instanceof URL) {
		CWD = fileURLToPath(CWD);
	}
	return CWD ? path.resolve(CWD) : process.cwd();
}
