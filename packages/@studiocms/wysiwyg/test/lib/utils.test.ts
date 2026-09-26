import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { firstUpperCase, parse } from '../../src/lib/utils';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Utils Tests';

describe(parentSuiteName, () => {
	[
		{
			input: 'hello',
			expected: 'Hello',
		},
		{
			input: 'world',
			expected: 'World',
		},
		{
			input: 'test',
			expected: 'Test',
		},
		{
			input: 'a',
			expected: 'A',
		},
		{
			input: 'z',
			expected: 'Z',
		},
		{
			input: '',
			expected: '',
		},
		{
			input: '123abc',
			expected: '123abc',
		},
		{
			input: 'abc123',
			expected: 'Abc123',
		},
		{
			input: '!hello',
			expected: '!hello',
		},
		{
			input: '@world',
			expected: '@world',
		},
		{
			input: 'hello world',
			expected: 'Hello world',
		},
		{
			input: 'Hello',
			expected: 'Hello',
		},
		{
			input: 'WORLD',
			expected: 'WORLD',
		},
		{
			input: 'hELLO',
			expected: 'HELLO',
		},
		{
			input: 'wOrLd',
			expected: 'WOrLd',
		},
		{
			input: 'ñandú',
			expected: 'Ñandú',
		},
		{
			input: 'αβγ',
			expected: 'Αβγ',
		},
	].forEach(({ input, expected }) => {
		test(`firstUpperCase('${input}') should return '${expected}'`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('firstUpperCase Function Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Converting first character of '${input}' to uppercase`, async (ctx) => {
				const result = firstUpperCase(input);
				await ctx.parameter('input', input);
				await ctx.parameter('expected', expected);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: '{"name": "John", "age": 30}',
			expected: { name: 'John', age: 30 },
		},
		{
			input: '[1, 2, 3, "test"]',
			expected: [1, 2, 3, 'test'],
		},
		{
			input: '{"user": {"name": "John", "address": {"city": "NYC"}}}',
			expected: { user: { name: 'John', address: { city: 'NYC' } } },
		},
		{
			input: '"hello"',
			expected: 'hello',
		},
		{
			input: '42',
			expected: 42,
		},
		{
			input: 'true',
			expected: true,
		},
		{
			input: 'null',
			expected: null,
		},
		{
			input: JSON.stringify({
				users: [
					{ id: 1, name: 'John', active: true },
					{ id: 2, name: 'Jane', active: false },
				],
				metadata: {
					total: 2,
					page: 1,
					hasMore: false,
				},
			}),
			expected: {
				users: [
					{ id: 1, name: 'John', active: true },
					{ id: 2, name: 'Jane', active: false },
				],
				metadata: {
					total: 2,
					page: 1,
					hasMore: false,
				},
			},
		},
	].forEach(({ input, expected }) => {
		test(`parse('${input}') should return expected object`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('parse Function Tests');
			await allure.tags(...sharedTags);

			await allure.step('Parsing JSON string', async (ctx) => {
				const result = parse<any>(input);
				await ctx.parameter('input', input);
				await ctx.parameter('expected', JSON.stringify(expected));
				expect(result).toEqual(expected);
			});
		});
	});

	[
		{
			input: 'invalid json',
		},
		{
			input: '{name: "John"}',
		},
		{
			input: '[1, 2, 3, ]',
		},
		{ input: '{"name": "John",}' },
		{ input: '' },
		{ input: '{"name": "John"' },
		{ input: '{"name": "John", "age":}' },
	].forEach(({ input }, index) => {
		test(`parse Invalid Test Case #${index + 1}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('parse Function Invalid Input Tests');
			await allure.tags(...sharedTags);

			await allure.step('Validating parse throws SyntaxError for invalid JSON', async (ctx) => {
				await ctx.parameter('input', input);
				expect(() => parse<any>(input)).toThrow(SyntaxError);
			});
		});
	});
});
