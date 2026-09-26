import * as allure from 'allure-js-commons';
import { Schema } from 'effect';
import { ParseError } from 'effect/ParseResult';
import { describe, expect, test } from 'vitest';
import { FunctionSchema, SyncFunctionSchema } from '../src/schemas';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Custom Schema Tests';

describe(parentSuiteName, () => {
	[
		{
			name: 'should validate and decode a function with correct input and output types',
			argsSchema: Schema.Struct({
				username: Schema.String,
				password: Schema.String,
			}),
			returnSchema: Schema.Boolean,
			rawFunction: async (data: { username: string; password: string }) =>
				data.username === 'admin' && data.password === '123',
			data: { username: 'admin', password: '123' },
			validate: async (result: any) => {
				expect(result).toBe(true);
			},
		},
		{
			name: 'should fail when decoding a non-function value',
			argsSchema: Schema.Struct({ value: Schema.String }),
			returnSchema: Schema.String,
			rawFunction: 'not a function' as any,
			data: null,
			validate: async (error: any) => {
				expect(error).toBeInstanceOf(Error);
			},
		},
		{
			name: 'should validate function arguments at runtime',
			argsSchema: Schema.Struct({ count: Schema.Number }),
			returnSchema: Schema.Number,
			rawFunction: async (data: { count: number }) => data.count * 2,
			data: { count: 5 },
			validate: async (result: any) => {
				expect(result).toBe(10);
			},
		},
		{
			name: 'should validate function return values',
			argsSchema: Schema.Struct({ value: Schema.String }),
			returnSchema: Schema.Number,
			rawFunction: async (_data: { value: string }) => 42,
			data: { value: 'test' },
			validate: async (result: any) => {
				expect(result).toBe(42);
			},
		},
	].forEach(({ name, argsSchema, returnSchema, rawFunction, data, validate }) => {
		test(`FunctionSchema decode: ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('FunctionSchema');
			await allure.tags(...sharedTags);

			await allure.step('Create FunctionSchema', async () => {
				const functionSchema = FunctionSchema(argsSchema as any, returnSchema as any);
				await allure.step('Decode raw function', async () => {
					try {
						const decoded = Schema.decodeSync(functionSchema)(rawFunction);
						const result = await decoded(data);
						await validate(result);
					} catch (error) {
						await validate(error);
					}
				});
			});
		});
	});

	[
		{
			name: 'should encode a typed function back to raw form',
			argsSchema: Schema.Struct({
				name: Schema.String,
				age: Schema.Number,
			}),
			returnSchema: Schema.String,
			typedFunction: async (data: { name: string; age: number }) =>
				`${data.name} is ${data.age} years old`,
			data: { name: 'Alice', age: 30 },
			validate: async (result: any) => {
				expect(result).toBe('Alice is 30 years old');
			},
		},
		{
			name: 'should fail when encoding a non-function value',
			argsSchema: Schema.Struct({ value: Schema.String }),
			returnSchema: Schema.String,
			typedFunction: null as any,
			data: null,
			validate: async (error: any) => {
				expect(error).toBeInstanceOf(ParseError);
			},
		},
	].forEach(({ name, argsSchema, returnSchema, typedFunction, data, validate }) => {
		test(`FunctionSchema encode: ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('FunctionSchema');
			await allure.tags(...sharedTags);

			await allure.step('Create FunctionSchema', async () => {
				const functionSchema = FunctionSchema(argsSchema as any, returnSchema as any);
				await allure.step('Encode typed function', async () => {
					try {
						const encoded = Schema.encodeSync(functionSchema)(typedFunction);
						const result = await encoded(data);
						await validate(result);
					} catch (error) {
						await validate(error);
					}
				});
			});
		});
	});

	[
		{
			name: 'should handle nested object schemas',
			argsSchema: Schema.Struct({
				user: Schema.Struct({
					id: Schema.Number,
					profile: Schema.Struct({
						name: Schema.String,
					}),
				}),
			}),
			returnSchema: Schema.String,
			rawFunction: async (data: any) => data.user.profile.name,
			data: {
				user: { id: 1, profile: { name: 'Bob' } },
			},
			validate: async (result: any) => {
				expect(result).toBe('Bob');
			},
		},
		{
			name: 'should handle array schemas',
			argsSchema: Schema.Struct({
				items: Schema.Array(Schema.Number),
			}),
			returnSchema: Schema.Number,
			rawFunction: async (data: { readonly items: readonly number[] }) =>
				data.items.reduce((sum, n) => sum + n, 0),
			data: { items: [1, 2, 3, 4, 5] },
			validate: async (result: any) => {
				expect(result).toBe(15);
			},
		},
		{
			name: 'should handle optional fields',
			argsSchema: Schema.Struct({
				required: Schema.String,
				optional: Schema.optional(Schema.Number),
			}),
			returnSchema: Schema.String,
			rawFunction: async (data: { required: string; optional?: number }) =>
				`${data.required}: ${data.optional ?? 'none'}`,
			data: { required: 'test', optional: 42 },
			validate: async (result: any) => {
				expect(result).toBe('test: 42');
			},
		},
		{
			name: 'should handle optional fields when optional is missing',
			argsSchema: Schema.Struct({
				required: Schema.String,
				optional: Schema.optional(Schema.Number),
			}),
			returnSchema: Schema.String,
			rawFunction: async (data: { required: string; optional?: number }) =>
				`${data.required}: ${data.optional ?? 'none'}`,
			data: { required: 'test' },
			validate: async (result: any) => {
				expect(result).toBe('test: none');
			},
		},
	].forEach(({ name, argsSchema, returnSchema, rawFunction, data, validate }) => {
		test(`FunctionSchema complex schemas: ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('FunctionSchema');
			await allure.tags(...sharedTags);

			await allure.step('Create FunctionSchema', async () => {
				const functionSchema = FunctionSchema(argsSchema as any, returnSchema as any);
				await allure.step('Decode raw function with complex schema', async () => {
					try {
						const decoded = Schema.decodeSync(functionSchema)(rawFunction as any);
						const result = await decoded(data);
						await validate(result);
					} catch (error) {
						await validate(error);
					}
				});
			});
		});
	});

	[
		{
			name: 'should validate and decode a synchronous function with correct input and output types',
			argsSchema: Schema.Struct({
				username: Schema.String,
				password: Schema.String,
			}),
			returnSchema: Schema.Boolean,
			rawFunction: (data: { username: string; password: string }) =>
				data.username === 'admin' && data.password === '123',
			data: { username: 'admin', password: '123' },
			validate: async (result: any) => {
				expect(result).toBe(true);
			},
		},
		{
			name: 'should fail when decoding a non-function value with SyncFunctionSchema',
			argsSchema: Schema.Struct({ value: Schema.String }),
			returnSchema: Schema.String,
			rawFunction: 'not a function' as any,
			data: null,
			validate: async (error: any) => {
				expect(error).toBeInstanceOf(Error);
			},
		},
		{
			name: 'should validate function arguments at runtime with SyncFunctionSchema',
			argsSchema: Schema.Struct({ count: Schema.Number }),
			returnSchema: Schema.Number,
			rawFunction: (data: { count: number }) => data.count * 2,
			data: { count: 5 },
			validate: async (result: any) => {
				expect(result).toBe(10);
			},
		},
		{
			name: 'should validate function return values with SyncFunctionSchema',
			argsSchema: Schema.Struct({ value: Schema.String }),
			returnSchema: Schema.Number,
			rawFunction: (_data: { value: string }) => 42,
			data: { value: 'test' },
			validate: async (result: any) => {
				expect(result).toBe(42);
			},
		},
		{
			name: 'should handle nested object schemas with SyncFunctionSchema',
			argsSchema: Schema.Struct({
				user: Schema.Struct({
					id: Schema.Number,
					profile: Schema.Struct({
						name: Schema.String,
					}),
				}),
			}),
			returnSchema: Schema.String,
			rawFunction: (data: any) => data.user.profile.name,
			data: {
				user: { id: 1, profile: { name: 'Bob' } },
			},
			validate: async (result: any) => {
				expect(result).toBe('Bob');
			},
		},
	].forEach(({ name, argsSchema, returnSchema, rawFunction, data, validate }) => {
		test(`SyncFunctionSchema decode: ${name}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('SyncFunctionSchema');
			await allure.tags(...sharedTags);

			await allure.step('Create SyncFunctionSchema', async () => {
				const functionSchema = SyncFunctionSchema(argsSchema as any, returnSchema as any);
				await allure.step('Decode raw function', async () => {
					try {
						const decoded = Schema.decodeSync(functionSchema)(rawFunction);
						const result = await decoded(data);
						await validate(result);
					} catch (error) {
						await validate(error);
					}
				});
			});
		});
	});
});
