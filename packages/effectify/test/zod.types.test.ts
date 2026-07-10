import * as allure from 'allure-js-commons';
import * as Schema from 'effect/Schema';
import { describe, expectTypeOf, test } from 'vitest';
import { z } from 'zod';
import { zodToEffect } from '../src/zod';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Zod to Effect Schema Type tests';

describe(parentSuiteName, () => {
	test('zodToEffect - matches output and input for kitchen-sink schema', async () => {
        await allure.parentSuite(parentSuiteName);
        await allure.suite(localSuiteName);
        await allure.subSuite('zodToEffect');
        await allure.tags(...sharedTags);

        await allure.step(
            'should convert Zod kitchen-sink schema to Effect schema and match output and input types',
            async (ctx) => {

                const kitchenSinkSchema = z.union([
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

                const effectSchema = zodToEffect(kitchenSinkSchema);

                await ctx.parameter('effectSchema', String(effectSchema));
                await ctx.parameter('kitchenSinkSchema', String(kitchenSinkSchema));

                expectTypeOf<Schema.Schema.Type<typeof effectSchema>>().toEqualTypeOf<
                    z.output<typeof kitchenSinkSchema>
                >();
                expectTypeOf<Schema.Schema.Encoded<typeof effectSchema>>().toEqualTypeOf<
                    z.input<typeof kitchenSinkSchema>
                >();
            });
	});

	test('zodToEffect - matches output and input for nested object schema', async () => {
        await allure.parentSuite(parentSuiteName);
        await allure.suite(localSuiteName);
        await allure.subSuite('zodToEffect');
        await allure.tags(...sharedTags);

        await allure.step(
            'should convert Zod nested object schema to Effect schema and match output and input types',
            async (ctx) => {

                const objectSchema = z.object({
                    name: z.string(),
                    count: z.optional(z.number()),
                    nested: z.array(z.object({ enabled: z.boolean() })),
                });

                const effectSchema = zodToEffect(objectSchema);

                await ctx.parameter('effectSchema', String(effectSchema));
                await ctx.parameter('objectSchema', String(objectSchema));

                expectTypeOf<Schema.Schema.Type<typeof effectSchema>>().toEqualTypeOf<
                    z.output<typeof objectSchema>
                >();
                expectTypeOf<Schema.Schema.Encoded<typeof effectSchema>>().toEqualTypeOf<
                    z.input<typeof objectSchema>
                >();
            });
	});
});
