import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { WYSIWYGSchema } from '../src/types';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'WYSIWYG Types Tests';

describe(parentSuiteName, () => {
	[
		{
			input: {},
			expected: {},
		},
		{
			input: undefined,
			expected: {},
		},
		{
			input: {
				sanitize: {
					allowElements: ['div', 'h1', 'p'],
					allowAttributes: {
						'*': ['class'],
						a: ['href'],
					},
				},
			},
			expected: {
				sanitize: {
					allowElements: ['div', 'h1', 'p'],
					allowAttributes: {
						'*': ['class'],
						a: ['href'],
					},
				},
			},
		},
		{
			input: {
				sanitize: {
					allowElements: ['div', 'span', 'p'],
				},
			},
			expected: {
				sanitize: {
					allowElements: ['div', 'span', 'p'],
				},
			},
		},
		{
			input: {
				sanitize: {
					allowAttributes: {
						'*': ['class', 'id'],
						img: ['src', 'alt'],
					},
				},
			},
			expected: {
				sanitize: {
					allowAttributes: {
						'*': ['class', 'id'],
						img: ['src', 'alt'],
					},
				},
			},
		},
		{
			input: {
				sanitize: {
					allowElements: [
						'div',
						'h1',
						'h2',
						'h3',
						'p',
						'strong',
						'em',
						'a',
						'ul',
						'li',
						'pre',
						'code',
					],
					allowAttributes: {
						'*': ['class', 'id'],
						a: ['href', 'target', 'rel'],
						img: ['src', 'alt', 'width', 'height'],
						pre: ['class'],
						code: ['class'],
					},
					blockElements: ['script', 'style'],
					allowComponents: true,
					allowCustomElements: false,
					allowComments: false,
				},
			},
			expected: {
				sanitize: {
					allowElements: [
						'div',
						'h1',
						'h2',
						'h3',
						'p',
						'strong',
						'em',
						'a',
						'ul',
						'li',
						'pre',
						'code',
					],
					allowAttributes: {
						'*': ['class', 'id'],
						a: ['href', 'target', 'rel'],
						img: ['src', 'alt', 'width', 'height'],
						pre: ['class'],
						code: ['class'],
					},
					blockElements: ['script', 'style'],
					allowComponents: true,
					allowCustomElements: false,
					allowComments: false,
				},
			},
		},
		{
			input: {
				sanitize: {
					allowElements: [],
					allowAttributes: {},
					blockElements: [],
				},
			},
			expected: {
				sanitize: {
					allowElements: [],
					allowAttributes: {},
					blockElements: [],
				},
			},
		},
	].forEach(({ input, expected }, index) => {
		test(`WYSIWYGSchema Test Case #${index + 1}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('WYSIWYGSchema Validation Tests');
			await allure.tags(...sharedTags);

			await allure.step('Validating WYSIWYGSchema parsing', async (ctx) => {
				const result = WYSIWYGSchema.parse(input);
				await ctx.parameter('input', JSON.stringify(input));
				await ctx.parameter('expected', JSON.stringify(expected));
				expect(result).toEqual(expected);
			});
		});
	});

	[
		{
			input: {
				sanitize: {
					allowElements: 'should be array', // Invalid type
				},
			},
		},
		{
			input: {
				sanitize: {
					allowElements: 'not-an-array',
				},
			},
		},
		{
			input: {
				sanitize: {
					allowAttributes: 'not-an-object',
				},
			},
		},
		{
			input: {
				sanitize: {
					blockElements: 'not-an-array',
				},
			},
		},
		{
			input: 'string',
		},
		{
			input: 123,
		},
		{
			input: true,
		},
		{
			input: [],
		},
	].forEach(({ input }, index) => {
		test(`WYSIWYGSchema Invalid Test Case #${index + 1}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('WYSIWYGSchema Invalid Input Tests');
			await allure.tags(...sharedTags);

			await allure.step('Validating WYSIWYGSchema throws error for invalid input', async (ctx) => {
				await ctx.parameter('input', JSON.stringify(input));
				expect(() => WYSIWYGSchema.parse(input)).toThrow();
			});
		});
	});
});
