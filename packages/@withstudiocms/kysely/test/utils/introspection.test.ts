import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { getDialect } from '../../src/utils/introspection';
import { allureTester, DBClientFixture, parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Introspection Utilities';

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

	test('getDialect identifies SQL dialect correctly sqlite', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'getDialect identifies SQL dialect correctly sqlite',
			tags: [...sharedTags],
		});

		await step('should identify dialects accurately', async () => {
			const { db } = await dbFixture.getClient();

			const dialect = await Effect.runPromise(getDialect(db));
			expect(dialect).toBe('sqlite');
		});
	});
});
