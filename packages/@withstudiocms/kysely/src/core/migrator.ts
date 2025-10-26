import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { Effect } from 'effect';
import {
	type Dialect,
	type Kysely,
	type Migration,
	type MigrationProvider,
	Migrator,
} from 'kysely';
import { rollbackMigration, syncDatabaseSchema, type TableDefinition } from '../utils/migrator.js';
import { kyselyClient, makeDBClientLive } from './client.js';
import { MigratorError } from './errors.js';

/**
 * Wraps a synchronous computation in an Effect, converting any thrown errors into a MigratorError.
 *
 * @template A - The result type produced by the provided computation.
 * @param _try - A no-argument function performing the computation. If this function throws, the thrown value is captured as the `cause`.
 * @returns An Effect that, when executed, runs the provided function and yields its result of type `A`. If the function throws, the Effect fails with a `MigratorError` whose `cause` is the original thrown value.
 *
 * @remarks
 * - Use this helper to normalize synchronous exceptions to `MigratorError` for consistent upstream error handling.
 * - This helper is intended for synchronous code paths; to wrap Promise-returning code, use the appropriate asynchronous Effect combinator.
 */
const useWithError = <A>(_try: () => A) =>
	Effect.try({
		try: _try,
		catch: (cause) => new MigratorError({ cause }),
	});

/**
 * Wraps a promise-producing callback in an Effect produced by Effect.tryPromise,
 * mapping any thrown/rejected value to a MigratorError.
 *
 * @typeParam A - The resolved value type of the promise returned by the provided callback.
 *
 * @param _try - A function that returns a Promise<A>. This function will be executed by Effect.tryPromise.
 *
 * @returns An Effect that, when executed, runs the provided promise factory and yields its resolved value of type A,
 *          or fails with a MigratorError containing the original cause when the promise rejects or an exception is thrown.
 *
 * @remarks
 * - This helper centralizes error mapping so callers receive a consistent MigratorError on failure.
 * - The underlying implementation uses Effect.tryPromise with a catch handler that constructs MigratorError.
 *
 * @example
 * // Produces an Effect that either succeeds with a string or fails with MigratorError
 * const effect = useWithErrorPromise(() => fetchStringFromRemote());
 */
const useWithErrorPromise = <A>(_try: () => Promise<A>) =>
	Effect.tryPromise({
		try: _try,
		catch: (cause) => new MigratorError({ cause }),
	});

/**
 * Provides migrations by reading JSON files from a folder and converting them into
 * runtime Migration objects compatible with the migrator system.
 *
 * Behavior:
 * - Reads all files in the provided migrationFolder and considers only files ending with `.json`.
 * - Each migration file is expected to be a JSON object with the shape:
 *   { definition: TableDefinition[], previousMigration: string }
 *   where `previousMigration` is the filename (without extension) of the previous migration
 *   or the string `"none"` to indicate there is no previous migration.
 * - The migration key is derived from the filename by stripping the `.json` extension.
 * - If a `previousMigration` is specified (not `"none"`), the provider will attempt to
 *   read the corresponding JSON file to obtain the previous schema definition.
 * - For each migration file a Migration object is created with:
 *   - up: runs syncDatabaseSchema(definition, previousSchema, db)
 *   - down: runs rollbackMigration(definition, previousSchema, db)
 *
 * Notes and error handling:
 * - IO and JSON parsing errors (readdir, readFile, JSON.parse) are propagated to the caller.
 * - The implementation assumes the JSON files contain valid TableDefinition arrays for both
 *   the current and previous schema (if present).
 *
 * Example migration JSON file:
 * {
 *   "definition": [ /* array of TableDefinition objects *\/ ],
 *   "previousMigration": "20240101_initial" // or "none"
 * }
 *
 * @remarks
 * The provider returns a mapping from migration keys (filename without extension)
 * to Migration objects. Consumers should execute migrations using the returned
 * Migration functions (up/down) against a database handle.
 *
 * @param props - Configuration object.
 * @param props.migrationFolder - Filesystem path to the folder containing migration JSON files.
 *
 * @public
 */
export class JSONMigrationProvider implements MigrationProvider {
	#props: { migrationFolder: string };

	constructor(props: { migrationFolder: string }) {
		this.#props = props;
	}

	async getMigrations(): Promise<Record<string, Migration>> {
		const files = await fs.readdir(this.#props.migrationFolder);
		const migrations: Record<string, Migration> = {};

		for (const fileName of files) {
			if (fileName.endsWith('.json')) {
				const filePath = path.join(this.#props.migrationFolder, fileName);
				const fileContent = await fs.readFile(filePath, 'utf-8');

				const { definition, previousMigration } = JSON.parse(fileContent) as {
					definition: TableDefinition[];
					previousMigration: string;
				};

				const migrationKey = fileName.substring(0, fileName.lastIndexOf('.'));

				const previousMigrationKey = previousMigration !== 'none' ? previousMigration : null;

				const previousSchemaFilePath = previousMigrationKey
					? path.join(this.#props.migrationFolder, `${previousMigrationKey}.json`)
					: null;

				let previousSchema: TableDefinition[] = [];

				if (previousSchemaFilePath) {
					const previousSchemaContent = await fs.readFile(previousSchemaFilePath, 'utf-8');
					const previousSchemaJSON = JSON.parse(previousSchemaContent) as {
						definition: TableDefinition[];
					};
					previousSchema = previousSchemaJSON.definition;
				}

				const migration: Migration = {
					up: async (db) => {
						await Effect.runPromise(syncDatabaseSchema(db, definition, previousSchema));
					},
					down: async (db) => {
						await Effect.runPromise(rollbackMigration(db, definition, previousSchema));
					},
				};

				migrations[migrationKey] = migration;
			}
		}

		return migrations;
	}
}

/**
 * Create a factory for constructing a Kysely `Migrator` that loads migration files from a filesystem folder.
 *
 * @typeParam Schema - The database schema type parameter for the provided `Kysely` instance.
 * @param migrationFolder - Filesystem path to the directory containing migration files. This path is forwarded to the `FileMigrationProvider`.
 * @returns A function that accepts a `Kysely<Schema>` instance and returns the result of `useWithError(...)` which constructs a `Migrator` configured with the given `db` and a `FileMigrationProvider` that uses the captured `fs`, `path`, and the provided `migrationFolder`.
 *
 * @remarks
 * - The returned function does not run migrations; it only constructs the `Migrator` (wrapped in the `useWithError` error-handling helper).
 * - `fs` and `path` are captured from the module scope and used by the underlying `FileMigrationProvider`.
 *
 * @example
 * const getMigrator = kyselyMigrator('./migrations');
 * const migratorInstance = getMigrator(kyselyInstance);
 */
const kyselyMigrator =
	(migrationFolder: string) =>
	<Schema>(db: Kysely<Schema>) =>
		useWithError(
			() =>
				new Migrator({
					db,
					provider: new JSONMigrationProvider({
						migrationFolder,
					}),
				})
		);

/**
 * Creates an Effect that builds a migration helper object for a given migration folder.
 *
 * @template Schema - The database schema type used by the migrator.
 *
 * @param migrationFolder - Path to the directory containing migration files.
 *
 * @returns An Effect which, when executed, yields a readonly object with migration helper functions:
 *  - toLatest: Runs all pending migrations to bring the database schema to the latest version.
 *  - up: Applies the next pending migration.
 *  - down: Reverts the most recently applied migration.
 *  - status: Retrieves the current migration list/status (e.g. applied vs. pending).
 *
 * Each helper is derived from an underlying migrator base and is wrapped via `useWithErrorPromise`
 * so that operations surface errors in a consistent, promise-friendly manner.
 *
 * Note: This function returns an Effect (deferred computation). You must run/interpret the Effect
 * to obtain and invoke the migration helpers.
 */
const makeMigrator = <Schema>(migrationFolder: string) =>
	Effect.gen(function* () {
		const base = yield* kyselyClient<Schema>().pipe(
			Effect.flatMap(kyselyMigrator(migrationFolder))
		);

		const toLatest = yield* useWithErrorPromise(() => base.migrateToLatest());
		const down = yield* useWithErrorPromise(() => base.migrateDown());
		const up = yield* useWithErrorPromise(() => base.migrateUp());
		const status = yield* useWithErrorPromise(() => base.getMigrations());

		return { toLatest, down, up, status } as const;
	});

/**
 * Create a "live" migrator Effect for a specific SQL dialect.
 *
 * This factory returns an Effect that, when executed, will:
 * - instantiate a Kysely client configured for the provided dialect (via makeKyselyClient),
 * - obtain a database client from the dbClient service,
 * - create a migrator that reads migration files from the package's ./migrations directory,
 * - and provide the Kysely client service to the migrator.
 *
 * @typeParam Schema - The Kysely schema type describing your database shape.
 * @param dialect - The SQL dialect to configure the Kysely client for (e.g., "postgres", "sqlite").
 * @param migrationFolder - Filesystem path to the directory containing migration files.
 * @returns An Effect that produces a configured migrator instance when run. The Effect may fail if the database client cannot be created, the Kysely client cannot be provided, or the migrations folder cannot be accessed/loaded.
 *
 * @remarks
 * - The migrations folder path is resolved relative to this module's __dirname ("./migrations").
 * - The returned Effect expects the runtime/environment to support the underlying Effect and service provisioning primitives used here.
 *
 * @example
 * // Run the returned Effect to obtain and use the migrator in your application runtime.
 */
export const makeMigratorLive = <Schema>(dialect: Dialect, migrationFolder: string) =>
	Effect.gen(function* () {
		const { db } = yield* makeDBClientLive<Schema>(dialect);
		return yield* makeMigrator<Schema>(migrationFolder).pipe(
			Effect.provideService(kyselyClient<Schema>(), db)
		);
	});
