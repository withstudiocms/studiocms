import { afterEach, beforeEach, describe, expect } from 'vitest';
import { KyselyTableManager, type TableDefinition } from '../src/plugin.js';
import { allureTester, DBClientFixture, parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Plugin Utilities';

/**
 * Database dialect to use for testing
 */
const dialect = 'sqlite' as const;

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteParentName: parentSuiteName,
		suiteName: localSuiteName,
	});

	const { js: dbFixture } = DBClientFixture<any>(localSuiteName);

	beforeEach(async () => {
		await dbFixture.cleanup();
	});

	afterEach(async () => {
		await dbFixture.cleanup();
	});

	test('KyselyTableManager can create and manage plugin tables', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'KyselyTableManager can create and manage plugin tables',
			tags: [...sharedTags],
		});

		await step('should create a plugin table successfully', async () => {
			const { db } = await dbFixture.getClient();

			const tableDefinition: TableDefinition = {
				name: 'plugin_test_table',
				columns: [
					{
						name: 'id',
						type: 'integer',
						primaryKey: true,
						autoIncrement: true,
					},
					{
						name: 'name',
						type: 'text',
						notNull: true,
					},
				],
			};

			let tableCreated = false;
			let tableExists = false;

			const manager = new KyselyTableManager(db, {
				tableDefinition,
				dialect,
				onTableCreated(tableName) {
					tableCreated = true;
					expect(tableName).toBe(tableDefinition.name);
				},
				onTableExists(_tableName) {
					tableExists = true;
				},
			});

			await manager.initialize();

			// Verify that the table was created
			expect(tableCreated).toBe(true);
			expect(tableExists).toBe(false);
		});
	});

	test('KyselyTableManager handles existing tables correctly', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'KyselyTableManager handles existing tables correctly',
			tags: [...sharedTags],
		});

		await step('should detect existing table without recreating it', async () => {
			const { db } = await dbFixture.getClient();

			const tableDefinition: TableDefinition = {
				name: 'plugin_existing_table',
				columns: [
					{
						name: 'id',
						type: 'integer',
						primaryKey: true,
						autoIncrement: true,
					},
					{
						name: 'name',
						type: 'text',
						notNull: true,
					},
				],
			};

			// Pre-create the table
			await db.schema
				.createTable(tableDefinition.name)
				.ifNotExists()
				.addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
				.addColumn('name', 'text', (col) => col.notNull())
				.execute();

			let tableCreated = false;
			let tableExists = false;

			const manager = new KyselyTableManager(db, {
				tableDefinition,
				dialect,
				onTableCreated(_tableName) {
					tableCreated = true;
				},
				onTableExists(tableName) {
					tableExists = true;
					expect(tableName).toBe(tableDefinition.name);
				},
			});

			await manager.initialize();

			// Verify that the table was detected as existing
			expect(tableCreated).toBe(false);
			expect(tableExists).toBe(true);
		});
	});
});
