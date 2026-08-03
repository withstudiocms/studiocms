import { base32 as base32Reference } from '@scure/base';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	decodeBase32,
	decodeBase32IgnorePadding,
	encodeBase32,
	encodeBase32LowerCase,
	encodeBase32LowerCaseNoPadding,
	encodeBase32NoPadding,
	encodeBase32UpperCase,
	encodeBase32UpperCaseNoPadding,
} from '../../src/encoding/base32.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'encoding/base32';

describe(parentSuiteName, () => {
	test('encodeBase32()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeBase32()');
		await allure.tags(...sharedTags);

		await allure.step('encodeBase32()', async (ctx) => {
			expect(encodeBase32(new Uint8Array())).toBe('');
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(encodeBase32(bytes)).toBe(base32Reference.encode(bytes));
			}
			await ctx.parameter('empty input', '""');
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('encodeBase32NoPadding()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeBase32NoPadding()');
		await allure.tags(...sharedTags);

		await allure.step('encodeBase32NoPadding()', async (ctx) => {
			expect(encodeBase32(new Uint8Array())).toBe('');
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(encodeBase32NoPadding(bytes)).toBe(
					base32Reference.encode(bytes).replaceAll('=', '')
				);
			}
			await ctx.parameter('empty input', '""');
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('encodeBase32UpperCase()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeBase32UpperCase()');
		await allure.tags(...sharedTags);

		await allure.step('encodeBase32UpperCase()', async (ctx) => {
			expect(encodeBase32(new Uint8Array())).toBe('');
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(encodeBase32UpperCase(bytes)).toBe(base32Reference.encode(bytes));
			}
			await ctx.parameter('empty input', '""');
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('encodeBase32UpperCaseNoPadding()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeBase32UpperCaseNoPadding()');
		await allure.tags(...sharedTags);

		await allure.step('encodeBase32UpperCaseNoPadding()', async (ctx) => {
			expect(encodeBase32(new Uint8Array())).toBe('');
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(encodeBase32UpperCaseNoPadding(bytes)).toBe(
					base32Reference.encode(bytes).replaceAll('=', '')
				);
			}
			await ctx.parameter('empty input', '""');
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('encodeBase32LowerCase()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeBase32LowerCase()');
		await allure.tags(...sharedTags);

		await allure.step('encodeBase32LowerCase()', async (ctx) => {
			expect(encodeBase32(new Uint8Array())).toBe('');
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(encodeBase32LowerCase(bytes)).toBe(base32Reference.encode(bytes).toLowerCase());
			}
			await ctx.parameter('empty input', '""');
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('encodeBase32LowerCaseNoPadding()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeBase32LowerCaseNoPadding()');
		await allure.tags(...sharedTags);

		await allure.step('encodeBase32LowerCaseNoPadding()', async (ctx) => {
			expect(encodeBase32(new Uint8Array())).toBe('');
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(encodeBase32LowerCaseNoPadding(bytes)).toBe(
					base32Reference.encode(bytes).toLowerCase().replaceAll('=', '')
				);
			}
			await ctx.parameter('empty input', '""');
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('decodeBase32()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodeBase32()');
		await allure.tags(...sharedTags);

		await allure.step('empty string returns empty Uint8Array', async () => {
			expect(decodeBase32('')).toStrictEqual(new Uint8Array());
		});

		await allure.step('round-trips through encodeBase32 (uppercase)', async (ctx) => {
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(decodeBase32(encodeBase32(bytes))).toStrictEqual(bytes);
			}
			await ctx.parameter('random iterations', String(100));
		});

		await allure.step('round-trips through encodeBase32 (lowercase)', async (ctx) => {
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(decodeBase32(encodeBase32(bytes).toLowerCase())).toStrictEqual(bytes);
			}
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('decodeBase32IgnorePadding()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodeBase32IgnorePadding()');
		await allure.tags(...sharedTags);

		await allure.step('empty string returns empty Uint8Array', async () => {
			expect(decodeBase32IgnorePadding('')).toStrictEqual(new Uint8Array());
		});

		await allure.step('round-trips through encodeBase32NoPadding', async (ctx) => {
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(decodeBase32IgnorePadding(encodeBase32NoPadding(bytes))).toStrictEqual(bytes);
			}
			await ctx.parameter('random iterations', String(100));
		});

		await allure.step('handles partial padding (invalid padding count)', async (ctx) => {
			for (let i = 1; i <= 100; i++) {
				const bytes = new Uint8Array(i);
				crypto.getRandomValues(bytes);
				expect(decodeBase32IgnorePadding(encodeBase32(bytes).replace('=', ''))).toStrictEqual(
					bytes
				);
			}
			await ctx.parameter('random iterations', String(100));
		});
	});

	test('decodeBase32() throws on invalid padding', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodeBase32()');
		await allure.tags(...sharedTags);

		await allure.step('throws on invalid padding', async (ctx) => {
			expect(() => decodeBase32('VKVA')).toThrowError();
			expect(() => decodeBase32('VKVK====')).toThrowError();
			expect(() => decodeBase32('V=======')).toThrowError();
			expect(() => decodeBase32('========')).toThrowError();
			expect(() => decodeBase32('=')).toThrowError();
			expect(() => decodeBase32('V=VKVKVK')).toThrowError();
			expect(() => decodeBase32('VKVKVKVK========')).toThrowError();
			expect(() => decodeBase32('VKVKVKVKV=VKVKVK')).toThrowError();
			expect(() => decodeBase32('VKVKVKVKV=======')).toThrowError();
			await ctx.parameter('invalid inputs', 'VKVA, VKVK====, V=======, ========, =, ...');
		});
	});
});
