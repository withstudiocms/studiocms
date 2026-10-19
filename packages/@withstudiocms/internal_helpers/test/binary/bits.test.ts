import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { rotl32, rotl64, rotr32, rotr64 } from '../../src/binary/bits.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'binary/bits';

describe(parentSuiteName, () => {
	test('rotl32()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('rotl32()');
		await allure.tags(...sharedTags);

		await allure.step('rotl32(0b11110000000000000000000000000000, 2)', async (ctx) => {
			expect(rotl32(0b11110000000000000000000000000000, 2)).toBe(
				0b11000000000000000000000000000011
			);
			await ctx.parameter('input', '0b11110000000000000000000000000000');
			await ctx.parameter('shift', String(2));
			await ctx.parameter('expected', '0b11000000000000000000000000000011');
		});
	});

	test('rotr32()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('rotr32()');
		await allure.tags(...sharedTags);

		await allure.step('rotr32(0b00000000000000000000000000001111, 2)', async (ctx) => {
			expect(rotr32(0b00000000000000000000000000001111, 2)).toBe(
				0b11000000000000000000000000000011
			);
			await ctx.parameter('input', '0b00000000000000000000000000001111');
			await ctx.parameter('shift', String(2));
			await ctx.parameter('expected', '0b11000000000000000000000000000011');
		});
	});

	test('rotl64()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('rotl64()');
		await allure.tags(...sharedTags);

		await allure.step(
			'rotl64(0b1111000000000000000000000000000000000000000000000000000000000000n, 2)',
			async (ctx) => {
				expect(rotl64(0b1111000000000000000000000000000000000000000000000000000000000000n, 2)).toBe(
					0b1100000000000000000000000000000000000000000000000000000000000011n
				);
				await ctx.parameter(
					'input',
					'0b1111000000000000000000000000000000000000000000000000000000000000n'
				);
				await ctx.parameter('shift', String(2));
				await ctx.parameter(
					'expected',
					'0b1100000000000000000000000000000000000000000000000000000000000011n'
				);
			}
		);
	});

	test('rotr64()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('rotr64()');
		await allure.tags(...sharedTags);

		await allure.step(
			'rotr64(0b0000000000000000000000000000000000000000000000000000000000001111n, 2)',
			async (ctx) => {
				expect(rotr64(0b0000000000000000000000000000000000000000000000000000000000001111n, 2)).toBe(
					0b1100000000000000000000000000000000000000000000000000000000000011n
				);
				await ctx.parameter(
					'input',
					'0b0000000000000000000000000000000000000000000000000000000000001111n'
				);
				await ctx.parameter('shift', String(2));
				await ctx.parameter(
					'expected',
					'0b1100000000000000000000000000000000000000000000000000000000000011n'
				);
			}
		);
	});
});
