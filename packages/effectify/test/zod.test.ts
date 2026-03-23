import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { zodToEffect } from '../src/zod';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Zod to Effect Schema Conversion Tests';

describe(parentSuiteName, () => {
	test('zodToEffect - Kitchen Sink', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('zodToEffect');
		await allure.tags(...sharedTags);

		await allure.step('should convert a complex Zod schema to an Effect schema', async (ctx) => {
			const zodSchema = z.union([
				z.object({
					abc: z.tuple([
						z.string(),
						z.object({
							def: z.optional(z.int()),
							ghi: z.array(z.number()),
						}),
					]),
				}),
				z.intersection(
					z.object({
						jkl: z.record(z.string(), z.array(z.number())),
					}),
					z.object({
						mno: z.map(z.set(z.date()), z.nullable(z.union([z.literal([1, 2, 3]), z.bigint()]))),
					})
				),
			]);

			const effectSchema = zodToEffect.writeable(zodSchema);
			expect(effectSchema).toMatchSnapshot();

			await ctx.parameter('effectSchema', String(effectSchema));
		});
	});

	[
		{
			schema: z.never(),
		},
		{
			schema: z.any(),
		},
		{
			schema: z.unknown(),
		},
		{
			schema: z.void(),
		},
		{
			schema: z.undefined(),
		},
		{
			schema: z.null(),
		},
		{
			schema: z.symbol(),
		},
		{
			schema: z.boolean(),
		},
		{
			schema: z.nan(),
		},
		{
			schema: z.int(),
		},
		{
			schema: z.bigint(),
		},
		{
			schema: z.number(),
		},
		{
			schema: z.string(),
		},
		{
			schema: z.date(),
		},
	].forEach(({ schema }) => {
		test(`zodToEffect - ${schema._zod.def.type}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('zodToEffect - Nullary Types');
			await allure.tags(...sharedTags);

			await allure.step(
				`should convert Zod ${schema._zod.def.type} to Effect schema`,
				async (ctx) => {
					const effectSchema = zodToEffect.writeable(schema);
					expect(effectSchema).toMatchSnapshot();
					await ctx.parameter('effectSchema', String(effectSchema));
				}
			);
		});
	});

	[
		{
			schema: z.array(z.string()),
		},
		{
			schema: z.array(z.array(z.number())),
		},
		{
			schema: z.array(z.unknown()),
		},
	].forEach(({ schema }) => {
		test(`zodToEffect - Array of ${schema._zod.def.type}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('zodToEffect - Array Types');
			await allure.tags(...sharedTags);

			await allure.step(
				`should convert Zod array of ${schema._zod.def.type} to Effect schema`,
				async (ctx) => {
					const effectSchema = zodToEffect.writeable(schema);
					expect(effectSchema).toMatchSnapshot();
					await ctx.parameter('effectSchema', String(effectSchema));
				}
			);
		});
	});

	[
		{
			schema: z.object({}),
		},
		{
			schema: z.object({
				abc: z.string(),
				def: z.optional(z.number()),
				ghi: z.array(z.boolean()),
			}),
		},
	].forEach(({ schema }) => {
		test(`zodToEffect - Object with keys ${Object.keys(schema.shape).join(', ')}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('zodToEffect - Object Types');
			await allure.tags(...sharedTags);

			await allure.step(
				`should convert Zod object with keys ${Object.keys(schema.shape).join(', ')} to Effect schema`,
				async (ctx) => {
					const effectSchema = zodToEffect.writeable(schema);
					expect(effectSchema).toMatchSnapshot();
					await ctx.parameter('effectSchema', String(effectSchema));
				}
			);
		});
	});
});
