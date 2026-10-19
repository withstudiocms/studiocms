import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { SHAKE128, SHAKE256, shake128, shake256 } from '../../../src/crypto/sha3/xof.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'crypto/sha3/xof';

describe(parentSuiteName, () => {
	test('SHAKE128', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('SHAKE128');
		await allure.tags(...sharedTags);

		await allure.step('incremental update() matches one-shot shake128()', async (ctx) => {
			const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
			for (let i = 0; i < randomValues.byteLength / 5; i++) {
				const expected = shake128(i + 1, randomValues.slice(0, i * 5));
				const hash = new SHAKE128(i + 1);
				for (let j = 0; j < i; j++) {
					hash.update(randomValues.slice(j * 5, (j + 1) * 5));
				}
				expect(hash.digest()).toStrictEqual(expected);
			}
			await ctx.parameter('chunk size', String(5));
			await ctx.parameter('iterations', String(100));
		});
	});

	test('SHAKE256', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('SHAKE256');
		await allure.tags(...sharedTags);

		await allure.step('incremental update() matches one-shot shake256()', async (ctx) => {
			const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
			for (let i = 0; i < randomValues.byteLength / 5; i++) {
				const expected = shake256(i + 1, randomValues.slice(0, i * 5));
				const hash = new SHAKE256(i + 1);
				for (let j = 0; j < i; j++) {
					hash.update(randomValues.slice(j * 5, (j + 1) * 5));
				}
				expect(hash.digest()).toStrictEqual(expected);
			}
			await ctx.parameter('chunk size', String(5));
			await ctx.parameter('iterations', String(100));
		});
	});
});
