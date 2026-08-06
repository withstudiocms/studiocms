import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	bigIntFromTwosComplementBytes,
	bigIntTwosComplementBytes,
	variableLengthQuantityBytes,
	variableLengthQuantityFromBytes,
} from '../../src/asn1/integer.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'asn1/integer';

describe(parentSuiteName, () => {
	[
		{ input: 0n, expected: new Uint8Array([0x00]) },
		{ input: 1n, expected: new Uint8Array([0x01]) },
		{ input: 127n, expected: new Uint8Array([0x7f]) },
		{ input: 128n, expected: new Uint8Array([0x00, 0x80]) },
		{
			input: 5476057457410545405175640567415649081748931656501235026509713265394n,
			expected: new Uint8Array([
				0x33, 0xff, 0x8e, 0xec, 0x07, 0x9c, 0x46, 0x65, 0x7a, 0x20, 0xb5, 0xd4, 0xb4, 0x7d, 0xf6,
				0xb0, 0x59, 0xca, 0x46, 0xb4, 0x4b, 0xfa, 0xae, 0x0d, 0x3b, 0xf6, 0x52, 0xf2,
			]),
		},
		{ input: -1n, expected: new Uint8Array([0xff]) },
		{ input: -128n, expected: new Uint8Array([0x80]) },
		{ input: -129n, expected: new Uint8Array([0xff, 0x7f]) },
		{
			input: -5476057457410545405175640567415649081748931656501235026509713265394n,
			expected: new Uint8Array([
				0xcc, 0x00, 0x71, 0x13, 0xf8, 0x63, 0xb9, 0x9a, 0x85, 0xdf, 0x4a, 0x2b, 0x4b, 0x82, 0x09,
				0x4f, 0xa6, 0x35, 0xb9, 0x4b, 0xb4, 0x05, 0x51, 0xf2, 0xc4, 0x09, 0xad, 0x0e,
			]),
		},
	].forEach(({ input, expected }) => {
		test(`bigIntTwosComplementBytes(${input})`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('bigIntTwosComplementBytes()');
			await allure.tags(...sharedTags);

			await allure.step(`bigIntTwosComplementBytes(${input})`, async (ctx) => {
				expect(bigIntTwosComplementBytes(input)).toStrictEqual(expected);
				await ctx.parameter('input', input.toString());
				await ctx.parameter('expected', expected.toString());
			});
		});
	});

	[
		{ input: new Uint8Array([0x00]), expected: 0n },
		{ input: new Uint8Array([0x01]), expected: 1n },
		{ input: new Uint8Array([0x7f]), expected: 127n },
		{ input: new Uint8Array([0x00, 0x80]), expected: 128n },
		{
			input: new Uint8Array([
				0x33, 0xff, 0x8e, 0xec, 0x07, 0x9c, 0x46, 0x65, 0x7a, 0x20, 0xb5, 0xd4, 0xb4, 0x7d, 0xf6,
				0xb0, 0x59, 0xca, 0x46, 0xb4, 0x4b, 0xfa, 0xae, 0x0d, 0x3b, 0xf6, 0x52, 0xf2,
			]),
			expected: 5476057457410545405175640567415649081748931656501235026509713265394n,
		},
		{ input: new Uint8Array([0xff]), expected: -1n },
		{ input: new Uint8Array([0x80]), expected: -128n },
		{ input: new Uint8Array([0xff, 0x7f]), expected: -129n },
		{
			input: new Uint8Array([
				0xcc, 0x00, 0x71, 0x13, 0xf8, 0x63, 0xb9, 0x9a, 0x85, 0xdf, 0x4a, 0x2b, 0x4b, 0x82, 0x09,
				0x4f, 0xa6, 0x35, 0xb9, 0x4b, 0xb4, 0x05, 0x51, 0xf2, 0xc4, 0x09, 0xad, 0x0e,
			]),
			expected: -5476057457410545405175640567415649081748931656501235026509713265394n,
		},
	].forEach(({ input, expected }) => {
		test(`bigIntFromTwosComplementBytes(${input})`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('bigIntFromTwosComplementBytes()');
			await allure.tags(...sharedTags);

			await allure.step(`bigIntFromTwosComplementBytes(${input})`, async (ctx) => {
				expect(bigIntFromTwosComplementBytes(input)).toBe(expected);
				await ctx.parameter('input', input.toString());
				await ctx.parameter('expected', expected.toString());
			});
		});
	});

	[
		{ input: 1n, expected: new Uint8Array([0x01]) },
		{ input: 0x7fn, expected: new Uint8Array([0x7f]) },
		{ input: 0xffn, expected: new Uint8Array([0x81, 0x7f]) },
		{ input: 0xffffn, expected: new Uint8Array([0x83, 0xff, 0x7f]) },
	].forEach(({ input, expected }) => {
		test(`variableLengthQuantityBytes(${input})`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('variableLengthQuantityBytes()');
			await allure.tags(...sharedTags);

			await allure.step(`variableLengthQuantityBytes(${input})`, async (ctx) => {
				expect(variableLengthQuantityBytes(input)).toStrictEqual(expected);
				await ctx.parameter('input', input.toString());
				await ctx.parameter('expected', expected.toString());
			});
		});
	});

	[
		{ input: new Uint8Array([0x01]), maxLen: 10, expected: [1n, 1] },
		{ input: new Uint8Array([0x7f]), maxLen: 10, expected: [0x7fn, 1] },
		{ input: new Uint8Array([0x81, 0x7f]), maxLen: 10, expected: [0xffn, 2] },
		{ input: new Uint8Array([0x83, 0xff, 0x7f]), maxLen: 10, expected: [0xffffn, 3] },
		{ input: new Uint8Array([0x83, 0xff, 0x7f, 0x00]), maxLen: 10, expected: [0xffffn, 3] },
	].forEach(({ input, maxLen, expected }) => {
		test(`variableLengthQuantityFromBytes(${input})`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('variableLengthQuantityFromBytes()');
			await allure.tags(...sharedTags);

			await allure.step(`variableLengthQuantityFromBytes(${input})`, async (ctx) => {
				expect(variableLengthQuantityFromBytes(input, maxLen)).toStrictEqual(expected);
				await ctx.parameter('input', input.toString());
				await ctx.parameter('maxLen', String(maxLen));
				await ctx.parameter('expected', JSON.stringify(expected.map(String)));
			});
		});
	});

	test('variableLengthQuantityFromBytes() - throws on truncated input', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('variableLengthQuantityFromBytes()');
		await allure.tags(...sharedTags);

		await allure.step('throws error when input bytes are truncated', async (ctx) => {
			expect(() =>
				variableLengthQuantityFromBytes(new Uint8Array([0x83, 0xff]), 10)
			).toThrowError();
			await ctx.parameter('input', new Uint8Array([0x83, 0xff]).toString());
			await ctx.parameter('maxLen', String(10));
		});
	});
});
