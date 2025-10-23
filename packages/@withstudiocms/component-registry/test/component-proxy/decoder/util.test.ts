import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	decodeHTML,
	decodeHTMLAttribute,
	decodeHTMLStrict,
	decodeXML,
	determineBranch,
	fromCodePoint,
	htmlDecodeTree,
	replaceCodePoint,
} from '../../../src/component-proxy/decoder/util.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Component Proxy Tests';

describe(parentSuiteName, () => {
	[
		{
			input: 'foo &amp; bar',
			expected: 'foo & bar',
		},
		{
			input: '2 &lt; 3 &gt; 1',
			expected: '2 < 3 > 1',
		},
		{
			input: 'Euro: &euro;',
			expected: 'Euro: €',
		},
		{
			input: 'A&#65;B',
			expected: 'AAB',
		},
		{
			input: 'A&#x41;B',
			expected: 'AAB',
		},
		{
			input: 'Smile: &#128512;',
			expected: 'Smile: 😀',
		},
		{
			input: 'foo &invalid bar',
			expected: 'foo &invalid bar',
		},
		{
			input: 'foo &amp bar',
			expected: 'foo & bar',
		},
		{
			input: 'foo & bar',
			expected: 'foo & bar',
		},
		{
			input: 'foo &amp; bar',
			expected: 'foo & bar',
		},
		{
			input: 'foo &amp; bar',
			expected: 'foo & bar',
		},
	].forEach(({ input, expected }) => {
		test(`decodeHTML with input: ${input}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('decodeHTML Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Decode HTML entities', async (ctx) => {
				const result = decodeHTML(input);
				ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: 'foo &amp; bar',
			expected: 'foo & bar',
		},
		{
			input: 'foo &amp bar',
			expected: 'foo &amp bar',
		},
		{
			input: 'foo &lt; bar',
			expected: 'foo < bar',
		},
	].forEach(({ input, expected }) => {
		test(`decodeHTMLStrict with input: ${input}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('decodeHTMLStrict Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Decode HTML entities strictly', async (ctx) => {
				const result = decodeHTMLStrict(input);
				ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: 'Tom &amp; Jerry',
			expected: 'Tom & Jerry',
		},
		{
			input: 'x &lt y',
			expected: 'x < y',
		},
		{
			input: 'foo &amp bar',
			expected: 'foo & bar',
		},
	].forEach(({ input, expected }) => {
		test(`decodeHTMLAttribute with input: ${input}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('decodeHTMLAttribute Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Decode HTML entities in attribute mode', async (ctx) => {
				const result = decodeHTMLAttribute(input);
				ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: 'foo &amp; bar',
			expected: 'foo & bar',
		},
		{
			input: 'foo &lt; bar &gt; baz',
			expected: 'foo < bar > baz',
		},
		{
			input: 'Caf&#233;',
			expected: 'Café',
		},
	].forEach(({ input, expected }) => {
		test(`decodeXML with input: ${input}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('decodeXML Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Decode XML entities strictly', async (ctx) => {
				const result = decodeXML(input);
				ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: 65,
			expected: 'A',
		},
		{
			input: 0x1f600,
			expected: '😀',
		},
	].forEach(({ input, expected }) => {
		test(`fromCodePoint with input: ${input}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('fromCodePoint Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', String(input));
			await allure.parameter('expected', String(expected));

			await allure.step('Convert code point to string', async (ctx) => {
				const result = fromCodePoint(input);
				ctx.parameter('result', String(result));
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			input: 0x110000,
			expected: 0xfffd,
		},
		{
			input: -1,
			expected: -1,
		},
		{
			input: 65,
			expected: 65,
		},
		{
			input: 0x1f600,
			expected: 0x1f600,
		},
	].forEach(({ input, expected }) => {
		test(`replaceCodePoint with input: ${input}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('replaceCodePoint Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', String(input));
			await allure.parameter('expected', String(expected));

			await allure.step('Replace invalid code points', async (ctx) => {
				const result = replaceCodePoint(input);
				ctx.parameter('result', String(result));
				expect(result).toBe(expected);
			});
		});
	});

	[
		{
			current: 0,
			nodeIndex: 0,
			char: 9999,
			toBe: -1,
		},
		{
			current: htmlDecodeTree[0],
			nodeIndex: 1,
			char: 0x61,
			notToBe: -1,
		},
	].forEach(({ current, nodeIndex, char, toBe, notToBe }) => {
		const desc =
			toBe === -1 ? 'returns -1 for invalid branch' : 'returns valid index for valid branch';
		test(`determineBranch ${desc} (char: ${char})`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('determineBranch Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('current', String(current));
			await allure.parameter('nodeIndex', String(nodeIndex));
			await allure.parameter('char', String(char));

			await allure.step('Determine branch index', async (ctx) => {
				const result = determineBranch(htmlDecodeTree, current, nodeIndex, char);
				ctx.parameter('result', String(result));
				if (toBe !== undefined) {
					expect(result).toBe(toBe);
				}
				if (notToBe !== undefined) {
					expect(result).not.toBe(notToBe);
				}
			});
		});
	});

	[
		{
			input: 'plain text',
			expected: 'plain text',
		},
		{
			input: '&lt;&gt;&amp;',
			expected: '<>&',
		},
		{
			input: '',
			expected: '',
		},
	].forEach(({ input, expected }) => {
		test(`decodeHTML (edge cases) with input: ${input}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('decodeHTML (edge cases) Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', input);
			await allure.parameter('expected', expected);

			await allure.step('Decode HTML entities using tree', async (ctx) => {
				const result = decodeHTML(input);
				ctx.parameter('result', result);
				expect(result).toBe(expected);
			});
		});
	});
});
