/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { decode, EntityLevel } from '../../../src/component-proxy/decoder/index';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Component Proxy Tests';

describe(parentSuiteName, () => {
	[
		{
			input: '&lt;tag&gt;',
			options: undefined,
			expected: '<tag>',
		},
		{
			input: 'foo &amp; bar',
			options: undefined,
			expected: 'foo & bar',
		},
		{
			input: '&lt;tag&gt;',
			options: EntityLevel.XML,
			expected: '<tag>',
		},
		{
			input: '&copy;',
			options: EntityLevel.HTML,
			expected: '©',
		},
		{
			input: 'foo &amp; bar',
			options: { level: EntityLevel.HTML },
			expected: 'foo & bar',
		},
		{
			input: '&copy;',
			options: { level: EntityLevel.HTML },
			expected: '©',
		},
		{
			input: '&lt;tag&gt;',
			options: { level: EntityLevel.XML },
			expected: '<tag>',
		},
		{
			input: '&copy;',
			options: { level: EntityLevel.XML, mode: 'Strict' as any },
			expected: '&copy;',
		},
		{
			input: '&lt;tag&gt;',
			options: { level: EntityLevel.XML, mode: 'Legacy' as any },
			expected: '<tag>',
		},
		{
			input: 'plain text',
			options: undefined,
			expected: 'plain text',
		},
	].forEach(({ input, options, expected }) => {
		test(`decode - input: ${input}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('decode Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('options', JSON.stringify(options));
			await allure.parameter('expected', expected);

			await allure.step('Decode input string', async (ctx) => {
				const result = decode(input, options);
				ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});
});
