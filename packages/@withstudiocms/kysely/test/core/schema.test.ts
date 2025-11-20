import { Schema } from 'effect';
import { describe, expect } from 'vitest';
import { ColumnType, ColumnTypesId, Generated, GeneratedAlways } from '../../src/core/schema';
import { allureTester, parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Schema Definitions';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteParentName: parentSuiteName,
		suiteName: localSuiteName,
	});

	test('ColumnTypesId symbol', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'ColumnTypesId Symbol',
			tags: [...sharedTags, 'schema:ColumnTypesId'],
		});

		await step('should be a unique symbol', async (ctx) => {
			await ctx.parameter('symbolDescription', ColumnTypesId.toString());
			const anotherSymbol = Symbol.for('kysely:ColumnTypesId');
			expect(ColumnTypesId).not.toBe(anotherSymbol);
		});
	});

	[
		{
			select: Schema.String,
			insert: Schema.Number,
			update: Schema.Boolean,
		},
		{
			select: Schema.Number,
			insert: Schema.Number,
			update: Schema.Number,
		},
		{
			select: Schema.Boolean,
			insert: Schema.String,
			update: Schema.String,
		},
	].forEach(({ select, insert, update }) => {
		test(`ColumnType with Select: ${select}, Insert: ${insert}, Update: ${update}`, async ({
			setupAllure,
			step,
		}) => {
			await setupAllure({
				subSuiteName: 'ColumnType Variants',
				tags: [
					...sharedTags,
					`schema:ColumnType:Select:${select.toString()}:Insert:${insert.toString()}:Update:${update.toString()}`,
				],
			});

			await step(
				`should create ColumnType with Select: ${select}, Insert: ${insert}, Update: ${update}`,
				async () => {
					const testColumn = ColumnType(select, insert, update);

					expect(testColumn.Select).toBe(select);
					expect(testColumn.Insert).toBe(insert);
					expect(testColumn.Update).toBe(update);
				}
			);
		});
	});

	test('Generated columns are marked correctly', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'Generated Columns',
			tags: [...sharedTags, 'schema:generatedColumns'],
		});

		await step('should mark schema types as generated', async () => {
			const generatedColumn = Generated(Schema.String);

			expect(generatedColumn.Select).toBe(Schema.String);
			expect(generatedColumn.Insert).toBeTypeOf('function');
			expect(generatedColumn.Update).toBe(Schema.String);
		});
	});

	test('GeneratedAlways columns are marked correctly', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'GeneratedAlways Columns',
			tags: [...sharedTags, 'schema:generatedAlwaysColumns'],
		});

		await step('should mark schema types as generated always', async () => {
			const generatedAlwaysColumn = GeneratedAlways(Schema.Number);

			expect(generatedAlwaysColumn.Select).toBe(Schema.Number);
			expect(generatedAlwaysColumn.Insert).toBe(Schema.Never);
			expect(generatedAlwaysColumn.Update).toBe(Schema.Never);
		});
	});
});
