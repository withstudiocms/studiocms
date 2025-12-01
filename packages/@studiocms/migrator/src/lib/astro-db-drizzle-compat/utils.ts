/** biome-ignore-all lint/suspicious/noExplicitAny: source from `@astrojs/db` */
import { LibsqlError } from '@libsql/client';
import { AstroError } from 'astro/errors';
import type { DBColumn } from './core-types.js';

export function hasPrimaryKey(column: DBColumn) {
	return 'primaryKey' in column.schema && !!column.schema.primaryKey;
}

const isWindows = process?.platform === 'win32';

export class AstroDbError extends AstroError {
	name = 'Astro DB Error';
}

export function isDbError(err: unknown): err is LibsqlError {
	return err instanceof LibsqlError || (err instanceof Error && (err as any).libsqlError === true);
}

function slash(path: string) {
	const isExtendedLengthPath = path.startsWith('\\\\?\\');

	if (isExtendedLengthPath) {
		return path;
	}

	return path.replace(/\\/g, '/');
}

export function pathToFileURL(path: string): URL {
	if (isWindows) {
		let slashed = slash(path);
		// Windows like C:/foo/bar
		if (!slashed.startsWith('/')) {
			slashed = '/' + slashed;
		}
		return new URL('file://' + slashed);
	}

	// Unix is easy
	return new URL('file://' + path);
}

/**
 * Map an object's values to a new set of values
 * while preserving types.
 */
export function mapObject<T, U = T>(
	item: Record<string, T>,
	callback: (key: string, value: T) => U
): Record<string, U> {
	return Object.fromEntries(
		Object.entries(item).map(([key, value]) => [key, callback(key, value)])
	);
}
