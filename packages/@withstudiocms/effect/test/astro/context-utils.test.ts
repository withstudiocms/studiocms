import * as allure from 'allure-js-commons';
import { describe, expect, it, test } from 'vitest';
import {
	parseAPIContextFormDataToObject,
	parseAPIContextJson,
	parseFormDataEntryToString,
	readAPIContextFormData,
	readAPIContextJson,
} from '../../src/astro/context-utils.js';
import { Effect, Schema } from '../../src/effect.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Context Utils Tests';

// Mocks
type MockedJson = { foo: string };
const mockJson = { foo: 'bar' };
const mockFormData = new FormData();
mockFormData.append('foo', 'bar');
mockFormData.append('file', new Blob(['content'], { type: 'text/plain' }));

const mockRequestJson = {
	json: async () => mockJson,
	formData: async () => mockFormData,
};

const mockAPIContext = { request: mockRequestJson };

// Dummy Schema
const dummySchema = Schema.Struct({
	foo: Schema.String,
	file: Schema.optional(Schema.Unknown),
});

describe(parentSuiteName, () => {
	test('Context Utils - readAPIContextJson', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('readAPIContextJson Tests');
		await allure.tags(...sharedTags);

		await allure.step('Testing readAPIContextJson with valid JSON', async (ctx) => {
			// @ts-expect-error - Testing with partial mock
			const effect = readAPIContextJson<MockedJson>(mockAPIContext);
			const result = await Effect.runPromise(effect);
			await ctx.parameter('Expected', JSON.stringify(mockJson));
			await ctx.parameter('Result', JSON.stringify(result));

			expect(result).toEqual(mockJson);
		});

		await allure.step('Testing readAPIContextJson with invalid JSON', async () => {
			const badContext = {
				request: {
					json: async () => {
						throw new Error('bad');
					},
				},
			};
			// @ts-expect-error - Testing with partial mock
			const effect = readAPIContextJson<object>(badContext);
			await expect(Effect.runPromise(effect)).rejects.toThrow(/Failed to parse JSON from Request/);
		});
	});

	test('Context Utils - parseAPIContextJson', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('parseAPIContextJson Tests');
		await allure.tags(...sharedTags);

		await allure.step('Testing parseAPIContextJson with valid JSON and schema', async (ctx) => {
			// @ts-expect-error - Testing with partial mock
			const effect = parseAPIContextJson(mockAPIContext, dummySchema);
			const result = await Effect.runPromise(effect);
			await ctx.parameter('Expected', JSON.stringify(mockJson));
			await ctx.parameter('Result', JSON.stringify(result));

			expect(result).toEqual(mockJson);
		});

		await allure.step('Testing parseAPIContextJson with valid JSON without schema', async (ctx) => {
			// @ts-expect-error - Testing with partial mock
			const effect = parseAPIContextJson<MockedJson>(mockAPIContext);
			const result = await Effect.runPromise(effect as Effect.Effect<MockedJson, Error, never>);
			await ctx.parameter('Expected', JSON.stringify(mockJson));
			await ctx.parameter('Result', JSON.stringify(result));

			expect(result).toEqual(mockJson);
		});

		await allure.step('Testing parseAPIContextJson with invalid JSON', async () => {
			const badContext = {
				request: {
					json: async () => {
						throw new Error('bad');
					},
				},
			};
			// @ts-expect-error - Testing with partial mock
			const effect = parseAPIContextJson<object>(badContext);
			await expect(
				Effect.runPromise(effect as Effect.Effect<object, Error, never>)
			).rejects.toThrow(/Failed to read JSON/);
		});
	});

	test('Context Utils - readAPIContextFormData', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('readAPIContextFormData Tests');
		await allure.tags(...sharedTags);

		await allure.step('Testing readAPIContextFormData with valid FormData', async (ctx) => {
			// @ts-expect-error - Testing with partial mock
			const effect = readAPIContextFormData(mockAPIContext);
			const result = await Effect.runPromise(effect);
			await ctx.parameter('Expected', 'FormData with keys: foo, file');
			await ctx.parameter('Result', `FormData with keys: ${Array.from(result.keys()).join(', ')}`);

			expect(result.get('foo')).toBe('bar');
		});

		await allure.step('Testing readAPIContextFormData with invalid FormData', async () => {
			const badContext = {
				request: {
					formData: async () => {
						throw new Error('bad');
					},
				},
			};
			// @ts-expect-error - Testing with partial mock
			const effect = readAPIContextFormData(badContext);
			await expect(Effect.runPromise(effect)).rejects.toThrow(
				/Failed to parse formData from Request/
			);
		});
	});

	test('Context Utils - parseAPIContextFormDataToObject', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('parseAPIContextFormDataToObject Tests');
		await allure.tags(...sharedTags);

		await allure.step('Testing parseAPIContextFormDataToObject with schema', async (ctx) => {
			// @ts-expect-error - Testing with partial mock
			const effect = parseAPIContextFormDataToObject(mockAPIContext, dummySchema);
			const result = await Effect.runPromise(effect);
			await ctx.parameter('Expected', JSON.stringify({ foo: 'bar' }));
			await ctx.parameter('Result', JSON.stringify({ foo: result.foo }));

			expect(result).toEqual({ foo: 'bar', file: mockFormData.get('file') });
		});

		await allure.step('Testing parseAPIContextFormDataToObject without schema', async (ctx) => {
			// @ts-expect-error - Testing with partial mock
			const effect = parseAPIContextFormDataToObject(mockAPIContext);
			const result = await Effect.runPromise(effect as Effect.Effect<unknown, Error, never>);
			await ctx.parameter('Expected', JSON.stringify({ foo: 'bar' }));
			await ctx.parameter('Result', JSON.stringify({ foo: (result as any).foo }));

			expect(result).toEqual({ foo: 'bar', file: mockFormData.get('file') });
		});

		await allure.step('Testing parseAPIContextFormDataToObject with invalid FormData', async () => {
			const badContext = {
				request: {
					formData: async () => {
						throw new Error('bad');
					},
				},
			};
			// @ts-expect-error - Testing with partial mock
			const effect = parseAPIContextFormDataToObject(badContext);
			await expect(
				Effect.runPromise(effect as Effect.Effect<unknown, Error, never>)
			).rejects.toThrow(/Failed to read form data/);
		});
	});

	test('Context Utils - parseFormDataEntryToString', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('parseFormDataEntryToString Tests');
		await allure.tags(...sharedTags);

		await allure.step('Testing parseFormDataEntryToString with string value', async (ctx) => {
			const effect = parseFormDataEntryToString(mockFormData, 'foo');
			const result = await Effect.runPromise(effect);
			await ctx.parameter('Expected', 'bar');
			await ctx.parameter('Result', result || 'null');

			expect(result).toBe('bar');
		});

		await allure.step('Testing parseFormDataEntryToString with non-string value', async (ctx) => {
			const effect = parseFormDataEntryToString(mockFormData, 'file');
			const result = await Effect.runPromise(effect);
			await ctx.parameter('Expected', 'null');
			await ctx.parameter('Result', result || 'null');

			expect(result).toBeNull();
		});

		await allure.step('Testing parseFormDataEntryToString with missing key', async (ctx) => {
			const effect = parseFormDataEntryToString(mockFormData, 'missing');
			const result = await Effect.runPromise(effect);
			await ctx.parameter('Expected', 'null');
			await ctx.parameter('Result', result || 'null');

			expect(result).toBeNull();
		});
	});
});
