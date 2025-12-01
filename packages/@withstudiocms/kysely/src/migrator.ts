import type { Dialect, Migration } from 'kysely';
import { makeMigratorLive } from './core/migrator.js';

/**
 * Dynamically imports a migration module by its name.
 *
 * @param name - The name of the migration file (without extension).
 * @returns A promise that resolves to the imported Migration object.
 */
const importMigration = async (name: string): Promise<Migration> => {
	return import(`./migrations/${name}.js`).then(({ up, down }) => ({ up, down }));
};

// Define the migrations object with all available migrations
// This object automatically gets updated when new migrations are created via the create-migration script
const migrationIndex: Record<string, Migration> = {
	'20251025T040912_init': await importMigration('20251025T040912_init'),
	'20251130T150847_drop_deprecated': await importMigration('20251130T150847_drop_deprecated'),
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
	makeMigratorLive<Schema>(dialect, migrationIndex);
