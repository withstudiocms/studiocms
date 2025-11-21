import { existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LibsqlDialect } from '@libsql/kysely-libsql';
import * as allure from 'allure-js-commons';
import { Effect } from 'effect';
import { test as baseTest } from 'vitest';
import { getDBClientLive } from '../src';
import { getMigratorLive } from '../src/migrator';

export const parentSuiteName = '@withstudiocms/kysely Package Tests';
export const sharedTags = ['package:@withstudiocms/kysely', 'type:unit', 'scope:withstudiocms'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the migrations folder for tests
// This ensures that the migrator in tests uses the compiled migrations preventing issues with missing files while allowing correct coverage reporting.
const migrationFolder = path.join(__dirname, '../dist/migrations');

/**
 * Extends the base test fixture with Allure helpers tailored for tests.
 *
 * @param allureMeta - Metadata used to initialize the Allure reporting context.
 * @param allureMeta.suiteParentName - The parent suite name applied to every test configured with this fixture.
 * @param allureMeta.suiteName - The suite name applied to every test configured with this fixture.
 *
 * @returns An object of test fixtures that includes:
 *  - setupAllure: async function to configure Allure context for an individual test.
 *  - step: a direct proxy to Allure's `step` function for creating nested steps.
 *
 * setupAllure(opts):
 * @param opts.subSuiteName - The sub-suite name to assign to the current test within the configured suite.
 * @param opts.tags - An array of tags to associate with the test (spread onto Allure).
 * @param opts.parameters - Optional key/value mapping of parameters to attach to the test in Allure.
 * @param opts.description - Optional textual description for the test in Allure.
 *
 * @remarks
 * Calling `setupAllure` will set the Allure parent suite and suite using the provided `allureMeta`,
 * then set the provided sub-suite name and attach the supplied tags. If a description is provided,
 * it will be set on the Allure test; any provided parameters will be added as Allure parameters.
 *
 * The exported `step` fixture is a convenience proxy to `allure.step`, enabling creation of
 * nested steps directly from tests while preserving typing.
 */
export const allureTester = (allureMeta: { suiteParentName: string; suiteName: string }) =>
	baseTest.extend<{
		setupAllure: (opts: {
			subSuiteName: string;
			tags: string[];
			parameters?: Record<string, string>;
			description?: string;
		}) => Promise<void>;
		step: typeof allure.step;
	}>({
		/**
		 * Sets up Allure reporting context for a test.
		 *
		 * @param opts - Options for configuring the Allure context.
		 * @param opts.subSuiteName - The name of the sub-suite.
		 * @param opts.tags - An array of tags to associate with the test.
		 * @param opts.parameters - Optional parameters to log in Allure.
		 * @param opts.description - Optional description for the test.
		 *
		 * @remarks
		 * This fixture configures the Allure reporting context by setting
		 * the parent suite, suite, and sub-suite names, along with any tags
		 * and parameters provided. This helps in organizing and categorizing
		 * test results in Allure reports.
		 */
		setupAllure: async ({ _local }, use) => {
			await use(async ({ subSuiteName, tags, parameters, description }) => {
				// Configure Allure context for the test
				await allure.parentSuite(allureMeta.suiteParentName);
				await allure.suite(allureMeta.suiteName);
				await allure.subSuite(subSuiteName);
				await allure.tags(...tags);

				// Add optional description and parameters
				if (description) {
					await allure.description(description);
				}
				if (parameters) {
					for (const [key, value] of Object.entries(parameters)) {
						await allure.parameter(key, value);
					}
				}
			});
		},

		/**
		 * Proxy to Allure's step function for use in tests.
		 *
		 * @remarks
		 * This fixture exposes Allure's step function directly,
		 * allowing tests to create nested steps in the Allure report.
		 */
		step: async ({ _local }, use) => await use(allure.step),
	});

/**
 * Creates a reusable test fixture for a file-backed LibSQL Kysely database.
 *
 * This factory sets up a file URL for a local SQLite/LibSQL test database (test.db next to this module)
 * and returns helpers to create a typed Kysely client and to remove the database file between tests.
 *
 * Remarks:
 * - Intended for use in tests where an isolated, file-backed database instance is required.
 * - The returned cleanup function is idempotent: it checks for the file's existence before attempting removal.
 * - The returned getClient function constructs a Kysely client configured with a LibsqlDialect pointed at the
 *   fixture database file and typed to StudioCMSDatabaseSchema.
 *
 * Returns:
 * An object with two properties:
 * - cleanup: () => Promise<void> — asynchronously removes the test database file if it exists.
 * - getClient: () => Kysely<StudioCMSDatabaseSchema> — creates and returns a new Kysely client instance
 *   configured to use the LibSQL dialect with the fixture file URL.
 *
 * Example:
 * ```ts
 * const { cleanup, getClient } = DBClientFixture();
 * await cleanup(); // ensure fresh state
 * const db = getClient();
 * // ... run tests against `db`
 * await cleanup(); // remove test.db after tests
 * ```
 */
export const DBClientFixture = <Schema>(suite: string) => {
	/**
	 * Normalizes a string to be filesystem-friendly by replacing non-alphanumeric characters.
	 *
	 * @param str - The input string to normalize.
	 * @returns A normalized string safe for use in file paths.
	 * @internal
	 */
	function normalize(str: string) {
		return str.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
	}

	/**
	 * File path for the test database, unique per suite.
	 *
	 * @remarks
	 * The database file is named using the normalized suite name to avoid collisions
	 * between different test suites.
	 * @internal
	 */
	const dbFilePath = `./test-${normalize(suite)}.db`;

	/**
	 * URL object representing the test database file location.
	 * @internal
	 */
	const dbFile = new URL(dbFilePath, import.meta.url);

	/**
	 * String URL for the test database file.
	 * @internal
	 */
	const url = dbFile.toString();

	/**
	 * LibsqlDialect instance configured to connect to the test database file.
	 */
	const dialect = new LibsqlDialect({ url });

	// ============================================
	// Primary Effect-based fixture implementations
	// ============================================

	/**
	 * Returns an object containing the cleanup and getClient functions.
	 */
	const effect = {
		/**
		 * Asynchronously removes the test database file if it exists.
		 *
		 * @remarks
		 * This function checks for the existence of the database file before attempting to delete it,
		 * ensuring that it does not throw an error if the file is already absent.
		 *
		 * @returns A Promise that resolves when the file has been removed or if it did not exist.
		 */
		cleanup: () =>
			Effect.gen(function* () {
				if (existsSync(dbFile)) {
					yield* Effect.promise(() => unlink(dbFile));
				}
			}),

		/**
		 * Creates and returns a Kysely client instance configured for the test database.
		 *
		 * @remarks
		 * The returned client is typed to StudioCMSDatabaseSchema and uses the LibSQL dialect
		 * pointed at the fixture database file.
		 *
		 * @returns A Kysely client instance for interacting with the test database.
		 */
		getClient: () => getDBClientLive<Schema>(dialect),

		/**
		 * Creates and returns a migrator instance configured for the test database.
		 *
		 * @remarks
		 * The returned migrator is configured to use the LibSQL dialect pointed at the fixture database file.
		 *
		 * @returns A migrator instance for managing migrations on the test database.
		 */
		getMigrator: () => getMigratorLive(dialect, migrationFolder),
	};

	// ============================================
	// Primary JavaScript-based fixture implementations
	// ============================================

	/**
	 * Returns an object containing JavaScript versions of the cleanup and getClient functions
	 */
	const js = {
		/**
		 * Asynchronously removes the test database file if it exists.
		 *
		 * @remarks
		 * This function checks for the existence of the database file before attempting to delete it,
		 * ensuring that it does not throw an error if the file is already absent.
		 *
		 * @returns A Promise that resolves when the file has been removed or if it did not exist.
		 */
		cleanup: () => Effect.runPromise(effect.cleanup()),

		/**
		 * Creates and returns a Kysely client instance configured for the test database.
		 *
		 * @remarks
		 * The returned client is typed to StudioCMSDatabaseSchema and uses the LibSQL dialect
		 * pointed at the fixture database file.
		 *
		 * @returns A Kysely client instance for interacting with the test database.
		 */
		getClient: () => Effect.runPromise(effect.getClient()),

		/**
		 * Creates and returns a migrator instance configured for the test database.
		 *
		 * @remarks
		 * The returned migrator is configured to use the LibSQL dialect pointed at the fixture database file.
		 *
		 * @returns A migrator instance for managing migrations on the test database.
		 */
		getMigrator: () => Effect.runPromise(effect.getMigrator()),
	};

	// ============================================
	// Return both Effect and JavaScript fixtures
	// ============================================

	return {
		dialect,
		effect,
		js,
		run: Effect.runPromise,
	};
};
