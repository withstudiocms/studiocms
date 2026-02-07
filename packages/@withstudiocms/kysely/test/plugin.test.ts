import { afterEach, beforeEach, describe, expect } from 'vitest';
import { KyselyTableManager, type TableDefinition } from '../src/plugin.js';
import { allureTester, DBClientFixture, parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Plugin Utilities';

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

	test('KyselyTableManager creates tables with indexes and foreign keys', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'KyselyTableManager creates tables with indexes and foreign keys',
			tags: [...sharedTags],
		});

		await step('should create a table with indexes and foreign keys successfully', async () => {
			const { db } = await dbFixture.getClient();
			const tableDefinition: TableDefinition = {
				name: 'plugin_sessions',
				columns: [
					{
						name: 'id',
						type: 'integer',
						primaryKey: true,
						autoIncrement: true,
					},
					{
						name: 'user_id',
						type: 'integer',
						notNull: true,
						references: {
							table: 'plugin_users',
							column: 'id',
							onDelete: 'cascade',
						},
					},
					{
						name: 'token',
						type: 'text',
						notNull: true,
						unique: true,
					},
					{
						name: 'expires_at',
						type: 'integer',
						notNull: true,
					},
				],
				indexes: [
					{
						name: 'idx_sessions_user_id',
						columns: ['user_id'],
					},
					{
						name: 'idx_sessions_token',
						columns: ['token'],
						unique: true,
					},
				],
			};

			const manager = new KyselyTableManager(db, {
				tableDefinition,
				onTableCreated(tableName) {
					expect(tableName).toBe(tableDefinition.name);
				},
				onTableExists(_tableName) {
					expect(_tableName).toBe(tableDefinition.name);
				},
			});

			await manager.initialize();

			// Verify that indexes were created
			const indexes = await db
				.selectFrom('sqlite_master')
				.select(['name'])
				.where('type', '=', 'index')
				.where('tbl_name', '=', tableDefinition.name)
				.execute();

			const indexNames = indexes.map((idx) => idx.name);
			expect(indexNames).toContain('idx_sessions_user_id');
			expect(indexNames).toContain('idx_sessions_token');
		});
	});

	test('KyselyTableManager handles trigger creation', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'KyselyTableManager handles trigger creation',
			tags: [...sharedTags],
		});

		await step('should create triggers ', async () => {
			const { db } = await dbFixture.getClient();
			const tableDefinition: TableDefinition = {
				name: 'plugin_audit_log',
				columns: [
					{
						name: 'id',
						type: 'integer',
						primaryKey: true,
						autoIncrement: true,
					},
					{
						name: 'action',
						type: 'text',
						notNull: true,
					},
					{
						name: 'timestamp',
						type: 'integer',
						notNull: true,
					},
				],
				triggers: [
					{
						name: 'set_audit_timestamp',
						timing: 'after',
						event: 'insert',
						bodySQL: 'UPDATE plugin_audit_log SET timestamp = CURRENT_TIMESTAMP;',
					},
				],
			};

			const manager = new KyselyTableManager(db, {
				tableDefinition,
				onTableCreated(tableName) {
					expect(tableName).toBe(tableDefinition.name);
				},
				onTableExists(_tableName) {
					expect(_tableName).toBe(tableDefinition.name);
				},
			});

			await manager.initialize();

			// Verify that the trigger was created
			const triggers = await db
				.selectFrom('sqlite_master')
				.select(['name'])
				.where('type', '=', 'trigger')
				.where('tbl_name', '=', tableDefinition.name)
				.execute();

			const triggerNames = triggers.map((trig) => trig.name);
			expect(triggerNames).toContain('set_audit_timestamp');
		});
	});

	test('KyselyTableManager can Handle default values in table definitions', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'KyselyTableManager can Handle default values in table definitions',
			tags: [...sharedTags],
		});

		await step('should create a table with default values successfully', async () => {
			const { db } = await dbFixture.getClient();
			const tableDefinition: TableDefinition = {
				name: 'plugin_default_values',
				columns: [
					{
						name: 'id',
						type: 'integer',
						primaryKey: true,
						autoIncrement: true,
					},
					{
						name: 'status',
						type: 'text',
						notNull: true,
						default: 'active',
					},
					{
						name: 'created_at',
						type: 'integer',
						notNull: true,
						defaultSQL: 'CURRENT_TIMESTAMP',
					},
				],
			};

			const manager = new KyselyTableManager(db, {
				tableDefinition,
				onTableCreated(tableName) {
					expect(tableName).toBe(tableDefinition.name);
				},
				onTableExists(_tableName) {
					expect(_tableName).toBe(tableDefinition.name);
				},
			});

			await manager.initialize();

			// Verify that the table was created with default values
			const columns = await db
				.selectFrom('sqlite_master')
				.select(['sql'])
				.where('type', '=', 'table')
				.where('name', '=', tableDefinition.name)
				.execute();

			const createTableSQL = columns[0]?.sql as string;
			expect(createTableSQL).toContain('"status" text default \'active\' not null');
			expect(createTableSQL).toContain('"created_at" integer default CURRENT_TIMESTAMP not null');
		});
	});

	test('KyselyTableManager can Create, drop, and recreate a table', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'KyselyTableManager can Create, drop, and recreate a table',
			tags: [...sharedTags],
		});

		const tableDefinition: TableDefinition = {
			name: 'plugin_recreate_table',
			columns: [
				{
					name: 'id',
					type: 'integer',
					primaryKey: true,
					autoIncrement: true,
				},
				{
					name: 'data',
					type: 'text',
					notNull: true,
				},
			],
		};

		await step('should drop and recreate a table successfully', async () => {
			const { db } = await dbFixture.getClient();

			const manager = new KyselyTableManager(db, {
				tableDefinition,
				onTableCreated(tableName) {
					expect(tableName).toBe(tableDefinition.name);
				},
				onTableExists(_tableName) {
					expect(_tableName).toBe(tableDefinition.name);
				},
			});

			// First creation
			await manager.initialize();

			const existsAfterCreate = await manager.tableExists();
			expect(existsAfterCreate).toBe(true);

			// Drop the table
			await manager.dropTable();

			const existsAfterDrop = await manager.tableExists();
			expect(existsAfterDrop).toBe(false);
		});

		await step('should recreate the dropped table successfully', async () => {
			const { db } = await dbFixture.getClient();

			const manager = new KyselyTableManager(db, {
				tableDefinition,
				onTableCreated(tableName) {
					expect(tableName).toBe(tableDefinition.name);
				},
				onTableExists(_tableName) {
					expect(_tableName).toBe(tableDefinition.name);
				},
			});

			// Recreate the table
			await manager.initialize();

			const existsAfterRecreate = await manager.tableExists();
			expect(existsAfterRecreate).toBe(true);

			// Recreate again to ensure idempotency
			await manager.recreateTable();

			const existsAfterSecondRecreate = await manager.tableExists();
			expect(existsAfterSecondRecreate).toBe(true);
		});
	});
});
