/** biome-ignore-all lint/style/noNonNullAssertion: Allowed in tests */

import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { Schema, Table } from '../../src';
import { allureTester, DBClientFixture, parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Client Core Functionality';

const testTable = Table({
	id: Schema.Number,
	name: Schema.String,
});

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteParentName: parentSuiteName,
		suiteName: localSuiteName,
	});

	const { js: dbFixture } = DBClientFixture<any>(localSuiteName);

	beforeEach(async () => {
		await dbFixture.cleanup();
		const { db } = await dbFixture.getClient();

		await db.schema
			.createTable('test_table')
			.ifNotExists()
			.addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
			.addColumn('name', 'text', (col) => col.notNull())
			.execute();
	});

	afterEach(async () => {
		await dbFixture.cleanup();
	});

	test('Kysely client can perform a simple query', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'Kysely client can perform a simple query',
			tags: [...sharedTags],
		});

		await step('should insert and retrieve a record successfully', async () => {
			const { db } = await dbFixture.getClient();

			// Insert a record
			const insertResult = await db
				.insertInto('test_table')
				.values({ name: 'Test Name' })
				.returningAll()
				.executeTakeFirst();

			expect(insertResult).toBeDefined();
			expect(insertResult?.name).toBe('Test Name');

			// Retrieve the record
			const selectResult = await db
				.selectFrom('test_table')
				.selectAll()
				.where('id', '=', insertResult!.id)
				.executeTakeFirst();

			expect(selectResult).toBeDefined();
			expect(selectResult?.name).toBe('Test Name');
		});
	});

	test('Kysely client handles withEncoder and withDecoder correctly', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'Kysely client handles withEncoder and withDecoder correctly',
			tags: [...sharedTags],
		});

		const { withDecoder, withEncoder } = await dbFixture.getClient();

		const testId = 1;
		const testName = 'Encoded Name';

		await step('should insert data with encoder', async (ctx) => {
			const insertEntry = withEncoder({
				encoder: testTable.Insert,
				callbackFn: (db, entry) =>
					db((client) => client.insertInto('test_table').values(entry).execute()),
			});

			await ctx.parameter('idToInsert', String(testId));
			await ctx.parameter('nameToInsert', testName);

			const result = await Effect.runPromise(insertEntry({ id: testId, name: testName }));

			await ctx.parameter('insertResult', JSON.stringify(result.toString()));
		});

		await step('should retrieve data with decoder', async (ctx) => {
			await ctx.parameter('idToRetrieve', String(testId));

			const selectEntry = withDecoder({
				decoder: testTable.Select,
				callbackFn: (db) =>
					db(
						(client) =>
							client
								.selectFrom('test_table')
								.selectAll()
								.where('id', '=', testId)
								.executeTakeFirstOrThrow() as Promise<{ id: number; name: string }>
					),
			});

			const result = await Effect.runPromise(selectEntry());
			await ctx.parameter('selectResult', JSON.stringify(result));

			expect(result).toBeDefined();
			expect(result.id).toBe(testId);
			expect(result.name).toBe(testName);
		});
	});

	test('Kysely client handles withEncoder and withCodec correctly', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'Kysely client handles withEncoder and withCodec correctly',
			tags: [...sharedTags],
		});

		const { withCodec, withEncoder } = await dbFixture.getClient();

		const testId = 1;
		const testName = 'Encoded Name';

		await step('should insert data with encoder', async (ctx) => {
			const insertEntry = withEncoder({
				encoder: testTable.Insert,
				callbackFn: (db, entry) =>
					db((client) => client.insertInto('test_table').values(entry).execute()),
			});

			await ctx.parameter('idToInsert', String(testId));
			await ctx.parameter('nameToInsert', testName);

			const result = await Effect.runPromise(insertEntry({ id: testId, name: testName }));

			await ctx.parameter('insertResult', JSON.stringify(result.toString()));
		});

		await step('should retrieve data with codec', async (ctx) => {
			await ctx.parameter('idToRetrieve', String(testId));

			const selectEntry = withCodec({
				encoder: Schema.Number,
				decoder: testTable.Select,
				callbackFn: (db, id) =>
					db(
						(client) =>
							client
								.selectFrom('test_table')
								.selectAll()
								.where('id', '=', id)
								.executeTakeFirstOrThrow() as Promise<{ id: number; name: string }>
					),
			});

			const result = await Effect.runPromise(selectEntry(testId));
			await ctx.parameter('selectResult', JSON.stringify(result));

			expect(result).toBeDefined();
			expect(result.id).toBe(testId);
			expect(result.name).toBe(testName);
		});
	});
});
