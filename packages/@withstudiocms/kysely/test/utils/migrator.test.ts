import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { syncDatabaseSchema, type TableDefinition } from '../../src/utils/migrator';
import { allureTester, DBClientFixture, parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Migrator Utilities';

const schemaA: TableDefinition[] = [
	{ name: 'a', columns: [{ name: 'id', type: 'integer', primaryKey: true }] },
];
const schemaB: TableDefinition[] = [
	...schemaA,
	{ name: 'b', columns: [{ name: 'id', type: 'integer', primaryKey: true }] },
];

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteParentName: parentSuiteName,
		suiteName: localSuiteName,
	});

	const { js: dbFixture } = DBClientFixture(localSuiteName);

	beforeEach(async () => {
		await dbFixture.cleanup();
		// freeze the wall clock so both saves fall in the same second
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
	});

	afterEach(async () => {
		vi.useRealTimers();
		await dbFixture.cleanup();
	});

	test('saveSchema does not collide when several migrations run in the same second (#1558)', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'schema history ids',
			tags: [...sharedTags],
		});

		await step('two syncs in one transaction and one second get consecutive ids', async () => {
			const { db } = await dbFixture.getClient();

			// mirrors Kysely's Migrator on transactional-DDL dialects: one transaction for the batch
			await db.transaction().execute(async (trx) => {
				await syncDatabaseSchema(trx, schemaA, []);
				await syncDatabaseSchema(trx, schemaB, schemaA);
			});

			const rows = await db
				.selectFrom('_kysely_schema_v1')
				.select('id')
				.orderBy('id', 'asc')
				.execute();

			expect(rows).toHaveLength(2);
			expect(rows[1].id).toBe(rows[0].id + 1);
		});
	});
});
