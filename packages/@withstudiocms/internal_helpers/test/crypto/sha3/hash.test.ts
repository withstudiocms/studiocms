import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	SHA3_224,
	SHA3_256,
	SHA3_384,
	SHA3_512,
	sha3_224,
	sha3_256,
	sha3_384,
	sha3_512,
} from '../../../src/crypto/sha3/hash.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'crypto/sha3/hash';

describe(parentSuiteName, () => {
	test('SHA3_224', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('SHA3_224');
		await allure.tags(...sharedTags);

		await allure.step('incremental update() matches one-shot sha3_224()', async (ctx) => {
			const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
			for (let i = 0; i < randomValues.byteLength / 5; i++) {
				const expected = sha3_224(randomValues.slice(0, i * 5));
				const hash = new SHA3_224();
				for (let j = 0; j < i; j++) {
					hash.update(randomValues.slice(j * 5, (j + 1) * 5));
				}
				expect(hash.digest()).toStrictEqual(expected);
			}
			await ctx.parameter('chunk size', String(5));
			await ctx.parameter('iterations', String(100));
		});
	});

	test('SHA3_256', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('SHA3_256');
		await allure.tags(...sharedTags);

		await allure.step('incremental update() matches one-shot sha3_256()', async (ctx) => {
			const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
			for (let i = 0; i < randomValues.byteLength / 5; i++) {
				const expected = sha3_256(randomValues.slice(0, i * 5));
				const hash = new SHA3_256();
				for (let j = 0; j < i; j++) {
					hash.update(randomValues.slice(j * 5, (j + 1) * 5));
				}
				expect(hash.digest()).toStrictEqual(expected);
			}
			await ctx.parameter('chunk size', String(5));
			await ctx.parameter('iterations', String(100));
		});
	});

	test('SHA3_384', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('SHA3_384');
		await allure.tags(...sharedTags);

		await allure.step('incremental update() matches one-shot sha3_384()', async (ctx) => {
			const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
			for (let i = 0; i < randomValues.byteLength / 5; i++) {
				const expected = sha3_384(randomValues.slice(0, i * 5));
				const hash = new SHA3_384();
				for (let j = 0; j < i; j++) {
					hash.update(randomValues.slice(j * 5, (j + 1) * 5));
				}
				expect(hash.digest()).toStrictEqual(expected);
			}
			await ctx.parameter('chunk size', String(5));
			await ctx.parameter('iterations', String(100));
		});
	});

	test('SHA3_512', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('SHA3_512');
		await allure.tags(...sharedTags);

		await allure.step('incremental update() matches one-shot sha3_512()', async (ctx) => {
			const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
			for (let i = 0; i < randomValues.byteLength / 5; i++) {
				const expected = sha3_512(randomValues.slice(0, i * 5));
				const hash = new SHA3_512();
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
