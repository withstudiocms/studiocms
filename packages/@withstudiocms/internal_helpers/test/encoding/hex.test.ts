import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { decodeHex, encodeHexLowerCase, encodeHexUpperCase } from '../../src/encoding/hex.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'encoding/hex';

describe(parentSuiteName, () => {
	test('encodeHexLowerCase()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeHexLowerCase()');
		await allure.tags(...sharedTags);

		await allure.step('encodeHexLowerCase()', async (ctx) => {
			const cases = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			for (const length of cases) {
				const data = crypto.getRandomValues(new Uint8Array(length));
				expect(encodeHexLowerCase(data)).toBe(Buffer.from(data).toString('hex'));
			}
			await ctx.parameter('lengths tested', cases.toString());
		});
	});

	test('encodeHexUpperCase()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeHexUpperCase()');
		await allure.tags(...sharedTags);

		await allure.step('encodeHexUpperCase()', async (ctx) => {
			const cases = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			for (const length of cases) {
				const data = crypto.getRandomValues(new Uint8Array(length));
				expect(encodeHexUpperCase(data)).toBe(Buffer.from(data).toString('hex').toUpperCase());
			}
			await ctx.parameter('lengths tested', cases.toString());
		});
	});

	test('decodeHex()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodeHex()');
		await allure.tags(...sharedTags);

		await allure.step(
			'round-trips through encodeHexLowerCase and encodeHexUpperCase',
			async (ctx) => {
				for (let i = 0; i < 100; i++) {
					const data = crypto.getRandomValues(new Uint8Array(i));
					expect(decodeHex(encodeHexLowerCase(data))).toStrictEqual(data);
					expect(decodeHex(encodeHexUpperCase(data))).toStrictEqual(data);
				}
				await ctx.parameter('random iterations', String(100));
			}
		);

		await allure.step('throws on invalid hex data', async (ctx) => {
			expect(() => decodeHex('a')).toThrowError();
			expect(() => decodeHex('x')).toThrowError();
			await ctx.parameter('invalid inputs', 'a, x');
		});
	});
});
