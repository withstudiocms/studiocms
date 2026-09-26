import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { SHA384, sha384 } from '../../../src/crypto/sha2/sha384.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'crypto/sha2/sha384';

describe(parentSuiteName, () => {
	test('SHA384', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('SHA384');
		await allure.tags(...sharedTags);

		await allure.step('incremental update() matches one-shot sha384()', async (ctx) => {
			const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
			for (let i = 0; i < randomValues.byteLength / 5; i++) {
				const expected = sha384(randomValues.slice(0, i * 5));
				const hash = new SHA384();
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
