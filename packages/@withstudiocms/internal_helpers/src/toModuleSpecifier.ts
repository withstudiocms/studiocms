/**
 * Convert a filesystem path or URL into a JS module specifier literal (JSON-quoted).
 * Paths are normalized to POSIX separators because Vite/Rollup normalize
 * module ids to POSIX internally; JSON.stringify is what makes the result
 * safe to embed (escaping backslashes, quotes, etc.).
 *
 * URL inputs use `.href` (e.g. `file://…`), which Vite accepts as a module id.
 */
export function toModuleSpecifier(filePath: string | URL): string {
	const normalized = filePath instanceof URL ? filePath.href : filePath;
	return JSON.stringify(normalized.replaceAll('\\', '/'));
}
