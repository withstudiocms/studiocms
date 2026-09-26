import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	decodeCodePoint,
	fromCodePoint,
	replaceCodePoint,
} from '../../../src/component-proxy/decoder/decode-codepoint.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Component Proxy Tests';

describe(parentSuiteName, () => {
	[
		{ input: 0x41, expected: 'A' },
		{ input: 0x20ac, expected: '€' },
		{ input: 0x1f600, expected: '😀' },
		{ input: 0x1d306, expected: '𝌆' },
	].forEach(({ input, expected }) => {
		test(`fromCodePoint with input: ${JSON.stringify(input)}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('fromCodePoint Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', String(input));
			await allure.parameter('expected', String(expected));

			await allure.step('Convert code point to string', async (ctx) => {
				const result = fromCodePoint(input as any);
				ctx.parameter('result', String(result));
				expect(result).toBe(expected);
			});
		});
	});

	[
		{ input: 0xd800, expected: 0xfffd },
		{ input: 0xdfff, expected: 0xfffd },
		{ input: 0x110000, expected: 0xfffd },
		{ input: 128, expected: 8364 }, // €
		{ input: 136, expected: 710 }, // ˆ
		{ input: 153, expected: 8482 }, // ™
		{ input: 0x41, expected: 0x41 },
		{ input: 0x20ac, expected: 0x20ac },
	].forEach(({ input, expected }) => {
		test(`replaceCodePoint with input: ${input}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('replaceCodePoint Tests');
			await allure.tags(...sharedTags);

			await allure.parameter('input', String(input));
			await allure.parameter('expected', String(expected));

			await allure.step('Replace code point if necessary', async (ctx) => {
				const result = replaceCodePoint(input);
				ctx.parameter('result', String(result));
				expect(result).toBe(expected);
			});
		});
	});

	[
		{ input: 128, expected: '€' },
		{ input: 136, expected: 'ˆ' },
		{ input: 153, expected: '™' },
		{ input: 0x41, expected: 'A' },
		{ input: 0x20ac, expected: '€' },
		{ input: 0x1f600, expected: '😀' },
	].forEach(({ input, expected }) => {
		test(`decodeCodePoint with input: ${input} (Deprecated)`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('decodeCodePoint Tests (Deprecated)');
			await allure.tags(...sharedTags);

			await allure.parameter('input', String(input));
			await allure.parameter('expected', String(expected));

			await allure.step('Decode code point to character', async (ctx) => {
				const result = decodeCodePoint(input);
				ctx.parameter('result', String(result));
				expect(result).toBe(expected);
			});
		});
	});
});
