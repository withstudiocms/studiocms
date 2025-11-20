import { LibsqlDialect } from '@libsql/kysely-libsql';
import { Effect } from 'effect';
import { Kysely } from 'kysely';
import { describe, expect } from 'vitest';
import { getDialect } from '../../src/utils/introspection';
import { allureTester, parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Introspection Utilities';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteParentName: parentSuiteName,
		suiteName: localSuiteName,
	});

	test('getDialect identifies SQL dialect correctly sqlite', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'getDialect identifies SQL dialect correctly sqlite',
			tags: [...sharedTags],
		});

		await step('should identify dialects accurately', async () => {
			const db = new Kysely({
				dialect: new LibsqlDialect({
					url: 'file:./test.db',
				}),
			});

			const dialect = await Effect.runPromise(getDialect(db));
			expect(dialect).toBe('sqlite');
		});
	});
});
