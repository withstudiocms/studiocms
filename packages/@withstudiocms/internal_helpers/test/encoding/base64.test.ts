import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	decodeBase64,
	decodeBase64IgnorePadding,
	encodeBase64,
	encodeBase64NoPadding,
} from '../../src/encoding/base64.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'encoding/base64';

describe(parentSuiteName, () => {
	test('encodeBase64()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeBase64()');
		await allure.tags(...sharedTags);

		await allure.step('encodeBase64()', async (ctx) => {
			expect(encodeBase64(new Uint8Array())).toBe('');
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(encodeBase64(bytes)).toBe(Buffer.from(bytes).toString('base64'));
			}
			await ctx.parameter('empty input', '""');
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('encodeBase64NoPadding()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeBase64NoPadding()');
		await allure.tags(...sharedTags);

		await allure.step('encodeBase64NoPadding()', async (ctx) => {
			expect(encodeBase64(new Uint8Array())).toBe('');
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(encodeBase64NoPadding(bytes)).toBe(encodeBase64(bytes).replaceAll('=', ''));
			}
			await ctx.parameter('empty input', '""');
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('decodeBase64()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodeBase64()');
		await allure.tags(...sharedTags);

		await allure.step('empty string returns empty Uint8Array', async () => {
			expect(decodeBase64('')).toStrictEqual(new Uint8Array());
		});

		await allure.step('round-trips through encodeBase64', async (ctx) => {
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(decodeBase64(encodeBase64(bytes))).toStrictEqual(bytes);
			}
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('decodeBase64IgnorePadding()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodeBase64IgnorePadding()');
		await allure.tags(...sharedTags);

		await allure.step('empty string returns empty Uint8Array', async () => {
			expect(decodeBase64IgnorePadding('')).toStrictEqual(new Uint8Array());
		});

		await allure.step('round-trips through encodeBase64NoPadding', async (ctx) => {
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(decodeBase64IgnorePadding(encodeBase64NoPadding(bytes))).toStrictEqual(bytes);
			}
			await ctx.parameter('random iterations', String(100));
		});

		await allure.step('handles partial padding (invalid padding count)', async (ctx) => {
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(decodeBase64IgnorePadding(encodeBase64(bytes).replace('=', ''))).toStrictEqual(bytes);
			}
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('decodeBase64() throws on invalid padding', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodeBase64()');
		await allure.tags(...sharedTags);

		await allure.step('throws on invalid padding', async (ctx) => {
			expect(() => decodeBase64('qqo')).toThrowError();
			expect(() => decodeBase64('qqp=')).toThrowError();
			expect(() => decodeBase64('q===')).toThrowError();
			expect(() => decodeBase64('====')).toThrowError();
			expect(() => decodeBase64('=')).toThrowError();
			expect(() => decodeBase64('q=q=')).toThrowError();
			expect(() => decodeBase64('qqqqq===')).toThrowError();
			expect(() => decodeBase64('qqqq====')).toThrowError();
			expect(() => decodeBase64('qqqqq=qq')).toThrowError();
			await ctx.parameter('invalid inputs', 'qqo, qqp=, q===, ====, =, q=q=, ...');
		});
	});
});
