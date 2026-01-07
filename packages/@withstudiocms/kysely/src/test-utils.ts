import { existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { createClient } from '@libsql/client/node';
import { Effect } from 'effect';
import { LibSQLDialect } from 'kysely-turso/libsql';
import { getDBClientLive } from './client.js';

type DBFixtureOptions = {
	suiteName: string;

	/**
	 * The current working directory for the database fixture.
	 *
	 * Should be `import.meta.url` from the calling module.
	 */
	cwd: string;
};

function normalize(str: string) {
	return str.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

/**
 * A test database fixture for managing a temporary Kysely database during tests.
 *
 * @typeParam Schema - The database schema type for the Kysely client.
 *
 * @remarks
 * This class provides utilities to create, manage, and clean up a test database
 * using LibSQL and Kysely. It supports both Effect-based and JavaScript-based
 * operations for flexibility in test implementations.
 *
 * @example
 * ```ts
 * const fixture = new DBFixture<YourSchemaType>({
 *     suiteName: 'example-suite',
 *     cwd: import.meta.url,
 * });
 *
 * // Using Effect-based utilities
 * await fixture.effect.cleanup();
 * const client = fixture.effect.getClient();
 * const migrator = fixture.effect.getMigrator();
 *
 * // Using JavaScript-based utilities
 * await fixture.js.cleanup();
 * const client = fixture.js.getClient();
 * const migrator = fixture.js.getMigrator();
 * ```
 */
export class DBFixture<Schema> {
	private dbUrl: URL;
	private dbString: string;

	constructor(options: DBFixtureOptions) {
		this.dbUrl = new URL(`./test-${normalize(options.suiteName)}.db`, options.cwd);
		this.dbString = this.dbUrl.toString();
	}

	/** Creates and returns a LibSQLDialect instance for the test database. */
	private getDialect(): LibSQLDialect {
		const url = this.dbString;

		return new LibSQLDialect({ client: createClient({ url }) });
	}

	/** Method to run Effect-based operations. */
	public run = Effect.runPromise;

	/** The LibsqlDialect instance for the test database. */
	public get dialect() {
		return this.getDialect();
	}

	/**
	 * Effect-based utilities for managing the test database fixture.
	 * - cleanup: () => Effect<never, never, void> — effect that removes the test database file if it exists.
	 * - getClient: () => Kysely<Schema> — function that returns a Kysely client connected to the test database.
	 * - getMigrator: () => Migrator — function that returns a migrator for managing database migrations.
	 */
	public effect = {
		/**
		 * Asynchronously removes the test database file if it exists.
		 *
		 * @remarks
		 * This function checks for the existence of the database file before attempting to delete it,
		 * ensuring that it does not throw an error if the file is already absent.
		 *
		 * @returns A Promise that resolves when the file has been removed or if it did not exist.
		 */
		cleanup: () => {
			const dbFile = this.dbUrl;
			return Effect.gen(function* () {
				if (existsSync(dbFile)) {
					yield* Effect.promise(() => unlink(dbFile));
				}
			});
		},

		/**
		 * Creates and returns a Kysely client instance configured for the test database.
		 *
		 * @returns A Kysely<Schema> client instance connected to the test database.
		 */
		getClient: () => {
			const dialect = this.getDialect();
			return getDBClientLive<Schema>(dialect);
		},
	};

	/** JavaScript-based utilities for managing the test database fixture. */
	public js = {
		/**
		 * Asynchronously removes the test database file if it exists.
		 *
		 * @remarks
		 * This function checks for the existence of the database file before attempting to delete it,
		 * ensuring that it does not throw an error if the file is already absent.
		 *
		 * @returns A Promise that resolves when the file has been removed or if it did not exist.
		 */
		cleanup: () => this.run(this.effect.cleanup()),

		/**
		 * Creates and returns a Kysely client instance configured for the test database.
		 *
		 * @returns A Kysely<Schema> client instance connected to the test database.
		 */
		getClient: () => this.run(this.effect.getClient()),
	};
}
