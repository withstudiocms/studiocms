import { afterEach, beforeEach, describe, expect } from 'vitest';
import { allureTester, DBClientFixture, parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Migrator Core Functionality';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteParentName: parentSuiteName,
		suiteName: localSuiteName,
	});

	const { js: dbFixture, run } = DBClientFixture<any>(localSuiteName);

	beforeEach(async () => {
		await dbFixture.cleanup();
	});

	afterEach(async () => {
		await dbFixture.cleanup();
	});

	test('Kysely migrator can perform migrations', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'Kysely migrator can perform migrations',
			tags: [...sharedTags],
		});

		const migrator = await dbFixture.getMigrator();

		await step('should apply migrations successfully', async () => {
			const migrationResult = await run(migrator.toLatest);
			expect(migrationResult.results?.length).toBeGreaterThan(0);
		});

		await step('should rollback migrations successfully', async () => {
			const rollbackResult = await run(migrator.down);
			expect(rollbackResult.results?.length).toBeGreaterThan(0);
		});
	});

	test('Kysely migrator can report current migration state', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'Kysely migrator can report current migration state',
			tags: [...sharedTags],
		});

		const migrator = await dbFixture.getMigrator();

		await step('should report current migration state accurately', async () => {
			// Apply migrations first
			await run(migrator.toLatest);

			const currentState = await run(migrator.status);

			expect(currentState.length).toBeGreaterThan(0);
			expect(currentState.find((m) => m.name === '20251025T040912_init')?.name).toBeDefined();
		});
	});
});
