import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolve as importMetaResolve } from 'import-meta-resolve';
import type * as unified from 'unified';

let cwdUrlStr: string | undefined;

/**
 * Dynamically imports a plugin given its name or path. The function first attempts to import the plugin from the current package, and if that fails, it tries to resolve and import the plugin from the user's project. This allows for flexible plugin usage, enabling users to specify plugins that are either bundled with the package or installed in their own project. The function returns a promise that resolves to the imported plugin, which can then be used in the markdown processing pipeline.
 *
 * @param p - The name or path of the plugin to import.
 * @returns A promise that resolves to the imported plugin.
 */
export async function importPlugin(p: string): Promise<unified.Plugin> {
	// Try import from this package first
	try {
		return (await import(/* @vite-ignore */ p)).default;
	} catch {}

	// Try import from user project
	cwdUrlStr ??= pathToFileURL(path.join(process.cwd(), 'package.json')).toString();
	return (await import(/* @vite-ignore */ importMetaResolve(p, cwdUrlStr))).default;
}
