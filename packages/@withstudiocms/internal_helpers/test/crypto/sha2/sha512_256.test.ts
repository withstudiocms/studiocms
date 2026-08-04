import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { SHA512_256, sha512_256 } from '../../../src/crypto/sha2/sha512_256.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'crypto/sha2/sha512_256';

describe(parentSuiteName, () => {
	test('SHA512_256', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('SHA512_256');
		await allure.tags(...sharedTags);

		await allure.step('incremental update() matches one-shot sha512_256()', async (ctx) => {
			const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
			for (let i = 0; i < randomValues.byteLength / 5; i++) {
				const expected = sha512_256(randomValues.slice(0, i * 5));
				const hash = new SHA512_256();
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
