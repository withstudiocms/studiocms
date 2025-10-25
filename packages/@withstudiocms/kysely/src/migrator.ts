import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Dialect } from 'kysely';
import { makeMigratorLive } from './core/migrator.js';
import type { StudioCMSDatabaseSchema } from './tables.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationFolder = path.join(__dirname, './migrations');

/**
 * Creates a live migrator instance bound to the package's migration folder.
 *
 * This convenience factory forwards the provided dialect to `makeMigratorLive`
 * and binds the module's default `migrationFolder`, producing a migrator that
 * runs migrations from the package's built-in migration directory.
 *
 * @template Schema - The database schema type; defaults to `StudioCMSDatabaseSchema`.
 * @param dialect - The SQL dialect implementation to use (e.g. Postgres, MySQL, SQLite).
 * @returns A migrator instance configured for the given dialect and the package migration folder.
 *
 * @example
 * const migrator = getMigratorLive<MySchema>('postgres');
 * await migrator.migrateToLatest();
 */
export const getMigratorLive = (dialect: Dialect) =>
	makeMigratorLive<StudioCMSDatabaseSchema>(dialect, migrationFolder);
