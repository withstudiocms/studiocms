import { afterEach, beforeEach, describe, expect } from 'vitest';
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
	});

	afterEach(async () => {
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

		await step(
			'two syncs back-to-back produce two strictly increasing ids, without waiting',
			async () => {
				const { db } = await dbFixture.getClient();

				const start = Date.now();
				await syncDatabaseSchema(db, schemaA, []);
				await syncDatabaseSchema(db, schemaB, schemaA);
				const elapsed = Date.now() - start;

				const rows = await db
					.selectFrom('_kysely_schema_v1')
					.select('id')
					.orderBy('id', 'asc')
					.execute();

				expect(rows).toHaveLength(2);
				expect(rows[1].id).toBeGreaterThan(rows[0].id);
				// the old retry loop slept 1s per collision; the fix must not
				expect(elapsed).toBeLessThan(900);
			}
		);
	});
});
