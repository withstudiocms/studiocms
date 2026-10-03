import { Effect } from 'effect';
import { describe, expect } from 'vitest';
import { detectRemovedTables } from '../../src/utils/tables';
import type { TableDefinition } from '../../src/utils/types';
import { allureTester, parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Table Utilities';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteParentName: parentSuiteName,
		suiteName: localSuiteName,
	});

	test('detectRemovedTables identifies removed tables correctly', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'detectRemovedTables Utility',
			tags: [...sharedTags],
		});

		await step('should detect removed tables accurately', async (ctx) => {
			const currentSchema: TableDefinition[] = [{ name: 'users', columns: [] }];
			const previousSchema: TableDefinition[] = [
				{ name: 'users', columns: [] },
				{ name: 'old_table', columns: [] },
			];

			await ctx.parameter('currentSchema', JSON.stringify(currentSchema));
			await ctx.parameter('previousSchema', JSON.stringify(previousSchema));

			const removedTables = await Effect.runPromise(
				detectRemovedTables(currentSchema, previousSchema)
			);

			await ctx.parameter('removedTables', JSON.stringify(removedTables));

			expect(removedTables).toEqual(['old_table']);
		});
	});
});
