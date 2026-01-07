/// <reference types="vite/client" />
/** biome-ignore-all lint/suspicious/noExplicitAny: Kysely Requirement */

import type { Effect } from '@withstudiocms/effect';
import type { MigratorError } from '@withstudiocms/kysely/core/errors';
import { makeMigratorLive } from '@withstudiocms/kysely/core/migrator';
import type {
	Dialect,
	Kysely,
	Migration,
	MigrationInfo,
	MigrationResultSet,
} from '@withstudiocms/kysely/kysely';

/**
 * Dynamically imports a migration module by its name.
 *
 * @param name - The name of the migration file (without extension).
 * @returns A promise that resolves to the imported Migration object.
 */
const importMigration = async (name: string): Promise<Migration> => {
	if (import.meta.env?.VITEST) {
		// When using vitest, we need to dynamically import the migrations directly from the built dist folder
		const migrations = import.meta.glob<{
			up: (db: Kysely<any>) => Promise<void>;
			down: (db: Kysely<any>) => Promise<void>;
		}>('../dist/migrations/*.js');
		const migrationPath = `../dist/migrations/${name}.js`;

		if (!migrations[migrationPath]) {
			throw new Error(`Migration not found: ${name}`);
		}

		return await migrations[migrationPath]();
	}

	return await import(`./migrations/${name}.js`).then(({ up, down }) => ({ up, down }));
};

// Define the migrations object with all available migrations
// This object automatically gets updated when new migrations are created via the create-migration script
const migrationIndex: Record<string, Migration> = {
	'20251025T040912_init': await importMigration('20251025T040912_init'),
	'20251130T150847_drop_deprecated': await importMigration('20251130T150847_drop_deprecated'),
	'20251221T002125_url-mapping': await importMigration('20251221T002125_url-mapping'),
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
export const getMigratorLive = <Schema>(
	dialect: Dialect
): Effect.Effect<
	{
		readonly toLatest: Effect.Effect<MigrationResultSet, MigratorError, never>;
		readonly down: Effect.Effect<MigrationResultSet, MigratorError, never>;
		readonly up: Effect.Effect<MigrationResultSet, MigratorError, never>;
		readonly status: Effect.Effect<readonly MigrationInfo[], MigratorError, never>;
	},
	MigratorError,
	never
> => makeMigratorLive<Schema>(dialect, migrationIndex);
