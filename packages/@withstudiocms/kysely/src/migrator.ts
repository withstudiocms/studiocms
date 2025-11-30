import type { Dialect, Migration } from 'kysely';
import { makeMigratorLive } from './core/migrator.js';

const migrations: Record<string, Migration> = {
	'20251025T040912_init': await import('./migrations/20251025T040912_init.js').then(
		({ up, down }) => ({ up, down })
	),
};

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
 * const migrator = getMigratorLive<MySchema>(yourDriver);
 * await migrator.migrateToLatest();
 */
export const getMigratorLive = <Schema>(dialect: Dialect) =>
	makeMigratorLive<Schema>(dialect, migrations);
