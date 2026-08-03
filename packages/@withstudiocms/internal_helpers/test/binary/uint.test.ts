import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { bigEndian, littleEndian } from '../../src/binary/uint.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'binary/uint';

describe(parentSuiteName, () => {
	// ── bigEndian ──────────────────────────────────────────────────────────────

	test('bigEndian.uint8()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('bigEndian.uint8()');
		await allure.tags(...sharedTags);

		await allure.step('returns correct value', async (ctx) => {
			expect(bigEndian.uint8(new Uint8Array([1]), 0)).toBe(1);
			await ctx.parameter('input', new Uint8Array([1]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', String(1));
		});

		await allure.step('excessive bytes', async (ctx) => {
			expect(bigEndian.uint8(new Uint8Array([1, 2]), 0)).toBe(1);
			await ctx.parameter('input', new Uint8Array([1, 2]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', String(1));
		});

		await allure.step('offset', async (ctx) => {
			expect(bigEndian.uint8(new Uint8Array([1, 2]), 1)).toBe(2);
			await ctx.parameter('input', new Uint8Array([1, 2]).toString());
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', String(2));
		});

		await allure.step('throws error on insufficient bytes', async () => {
			expect(() => bigEndian.uint8(new Uint8Array([]), 0)).toThrowError();
		});

		await allure.step('throws error on insufficient bytes with offset', async () => {
			expect(() => bigEndian.uint8(new Uint8Array([1]), 1)).toThrowError();
		});
	});

	test('bigEndian.uint16()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('bigEndian.uint16()');
		await allure.tags(...sharedTags);

		await allure.step('returns correct value', async (ctx) => {
			expect(bigEndian.uint16(new Uint8Array([1, 2]), 0)).toBe(0x0102);
			await ctx.parameter('input', new Uint8Array([1, 2]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x0102');
		});

		await allure.step('excessive bytes', async (ctx) => {
			expect(bigEndian.uint16(new Uint8Array([1, 2, 3]), 0)).toBe(0x0102);
			await ctx.parameter('input', new Uint8Array([1, 2, 3]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x0102');
		});

		await allure.step('offset', async (ctx) => {
			expect(bigEndian.uint16(new Uint8Array([1, 2, 3]), 1)).toBe(0x0203);
			await ctx.parameter('input', new Uint8Array([1, 2, 3]).toString());
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', '0x0203');
		});

		await allure.step('throws error on insufficient bytes', async () => {
			expect(() => bigEndian.uint16(new Uint8Array([1]), 0)).toThrowError();
		});

		await allure.step('throws error on insufficient bytes with offset', async () => {
			expect(() => bigEndian.uint16(new Uint8Array([1, 2]), 1)).toThrowError();
		});
	});

	test('bigEndian.uint32()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('bigEndian.uint32()');
		await allure.tags(...sharedTags);

		await allure.step('returns correct value', async (ctx) => {
			expect(bigEndian.uint32(new Uint8Array([1, 2, 3, 4]), 0)).toBe(0x01020304);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x01020304');
		});

		await allure.step('excessive bytes', async (ctx) => {
			expect(bigEndian.uint32(new Uint8Array([1, 2, 3, 4, 5]), 0)).toBe(0x01020304);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4, 5]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x01020304');
		});

		await allure.step('offset', async (ctx) => {
			expect(bigEndian.uint32(new Uint8Array([1, 2, 3, 4, 5]), 1)).toBe(0x02030405);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4, 5]).toString());
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', '0x02030405');
		});

		await allure.step('throws error on insufficient bytes', async () => {
			expect(() => bigEndian.uint32(new Uint8Array([1]), 0)).toThrowError();
		});

		await allure.step('throws error on insufficient bytes with offset', async () => {
			expect(() => bigEndian.uint32(new Uint8Array([1, 2, 3, 4]), 1)).toThrowError();
		});
	});

	test('bigEndian.uint64()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('bigEndian.uint64()');
		await allure.tags(...sharedTags);

		await allure.step('returns correct value', async (ctx) => {
			expect(bigEndian.uint64(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), 0)).toBe(
				0x0102030405060708n
			);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x0102030405060708n');
		});

		await allure.step('excessive bytes', async (ctx) => {
			expect(bigEndian.uint64(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), 0)).toBe(
				0x0102030405060708n
			);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x0102030405060708n');
		});

		await allure.step('offset', async (ctx) => {
			expect(bigEndian.uint64(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), 1)).toBe(
				0x0203040506070809n
			);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]).toString());
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', '0x0203040506070809n');
		});

		await allure.step('throws error on insufficient bytes', async () => {
			expect(() => bigEndian.uint64(new Uint8Array([1]), 0)).toThrowError();
		});

		await allure.step('throws error on insufficient bytes with offset', async () => {
			expect(() => bigEndian.uint64(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), 1)).toThrowError();
		});
	});

	test('bigEndian.putUint8()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('bigEndian.putUint8()');
		await allure.tags(...sharedTags);

		await allure.step('sets correct value', async (ctx) => {
			const data = new Uint8Array(1);
			bigEndian.putUint8(data, 1, 0);
			expect(data).toStrictEqual(new Uint8Array([1]));
			await ctx.parameter('value', String(1));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([1]).toString());
		});

		await allure.step('excessive bytes', async (ctx) => {
			const data = new Uint8Array(2);
			bigEndian.putUint8(data, 1, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 0]));
			await ctx.parameter('value', String(1));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([1, 0]).toString());
		});

		await allure.step('offset', async (ctx) => {
			const data = new Uint8Array(2);
			bigEndian.putUint8(data, 1, 1);
			expect(data).toStrictEqual(new Uint8Array([0, 1]));
			await ctx.parameter('value', String(1));
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', new Uint8Array([0, 1]).toString());
		});

		await allure.step('insufficient space', async () => {
			const data = new Uint8Array(0);
			expect(() => bigEndian.putUint8(data, 1, 0)).toThrow();
		});

		await allure.step('insufficient space with offset', async () => {
			const data = new Uint8Array(1);
			expect(() => bigEndian.putUint8(data, 1, 1)).toThrow();
		});
	});

	test('bigEndian.putUint16()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('bigEndian.putUint16()');
		await allure.tags(...sharedTags);

		await allure.step('sets correct value', async (ctx) => {
			const data = new Uint8Array(2);
			bigEndian.putUint16(data, 258, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 2]));
			await ctx.parameter('value', String(258));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([1, 2]).toString());
		});

		await allure.step('excessive bytes', async (ctx) => {
			const data = new Uint8Array(3);
			bigEndian.putUint16(data, 258, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 2, 0]));
			await ctx.parameter('value', String(258));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([1, 2, 0]).toString());
		});

		await allure.step('offset', async (ctx) => {
			const data = new Uint8Array(3);
			bigEndian.putUint16(data, 258, 1);
			expect(data).toStrictEqual(new Uint8Array([0, 1, 2]));
			await ctx.parameter('value', String(258));
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', new Uint8Array([0, 1, 2]).toString());
		});

		await allure.step('insufficient space', async () => {
			const data = new Uint8Array(0);
			expect(() => bigEndian.putUint16(data, 1, 0)).toThrow();
		});

		await allure.step('insufficient space with offset', async () => {
			const data = new Uint8Array(2);
			expect(() => bigEndian.putUint16(data, 258, 1)).toThrow();
		});
	});

	test('bigEndian.putUint32()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('bigEndian.putUint32()');
		await allure.tags(...sharedTags);

		await allure.step('sets correct value', async (ctx) => {
			const data = new Uint8Array(4);
			bigEndian.putUint32(data, 16909060, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 2, 3, 4]));
			await ctx.parameter('value', String(16909060));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([1, 2, 3, 4]).toString());
		});

		await allure.step('excessive bytes', async (ctx) => {
			const data = new Uint8Array(5);
			bigEndian.putUint32(data, 16909060, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 2, 3, 4, 0]));
			await ctx.parameter('value', String(16909060));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([1, 2, 3, 4, 0]).toString());
		});

		await allure.step('offset', async (ctx) => {
			const data = new Uint8Array(5);
			bigEndian.putUint32(data, 16909060, 1);
			expect(data).toStrictEqual(new Uint8Array([0, 1, 2, 3, 4]));
			await ctx.parameter('value', String(16909060));
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', new Uint8Array([0, 1, 2, 3, 4]).toString());
		});

		await allure.step('insufficient space', async () => {
			const data = new Uint8Array(0);
			expect(() => bigEndian.putUint32(data, 1, 0)).toThrow();
		});

		await allure.step('insufficient space with offset', async () => {
			const data = new Uint8Array(4);
			expect(() => bigEndian.putUint32(data, 16909060, 1)).toThrow();
		});
	});

	test('bigEndian.putUint64()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('bigEndian.putUint64()');
		await allure.tags(...sharedTags);

		await allure.step('sets correct value', async (ctx) => {
			const data = new Uint8Array(8);
			bigEndian.putUint64(data, 72623859790382856n, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
			await ctx.parameter('value', String(72623859790382856n));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).toString());
		});

		await allure.step('excessive bytes', async (ctx) => {
			const data = new Uint8Array(9);
			bigEndian.putUint64(data, 72623859790382856n, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 0]));
			await ctx.parameter('value', String(72623859790382856n));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 0]).toString());
		});

		await allure.step('offset', async (ctx) => {
			const data = new Uint8Array(9);
			bigEndian.putUint64(data, 72623859790382856n, 1);
			expect(data).toStrictEqual(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8]));
			await ctx.parameter('value', String(72623859790382856n));
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8]).toString());
		});

		await allure.step('insufficient space', async () => {
			const data = new Uint8Array(0);
			expect(() => bigEndian.putUint64(data, 72623859790382856n, 0)).toThrow();
		});

		await allure.step('insufficient space with offset', async () => {
			const data = new Uint8Array(8);
			expect(() => bigEndian.putUint64(data, 72623859790382856n, 1)).toThrow();
		});
	});

	// ── littleEndian ───────────────────────────────────────────────────────────

	test('littleEndian.uint8()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('littleEndian.uint8()');
		await allure.tags(...sharedTags);

		await allure.step('returns correct value', async (ctx) => {
			expect(littleEndian.uint8(new Uint8Array([1]), 0)).toBe(1);
			await ctx.parameter('input', new Uint8Array([1]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', String(1));
		});

		await allure.step('excessive bytes', async (ctx) => {
			expect(littleEndian.uint8(new Uint8Array([1, 2]), 0)).toBe(1);
			await ctx.parameter('input', new Uint8Array([1, 2]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', String(1));
		});

		await allure.step('offset', async (ctx) => {
			expect(littleEndian.uint8(new Uint8Array([1, 2]), 1)).toBe(2);
			await ctx.parameter('input', new Uint8Array([1, 2]).toString());
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', String(2));
		});

		await allure.step('throws error on insufficient bytes', async () => {
			expect(() => littleEndian.uint8(new Uint8Array([]), 0)).toThrowError();
		});

		await allure.step('throws error on insufficient bytes with offset', async () => {
			expect(() => littleEndian.uint8(new Uint8Array([1]), 1)).toThrowError();
		});
	});

	test('littleEndian.uint16()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('littleEndian.uint16()');
		await allure.tags(...sharedTags);

		await allure.step('returns correct value', async (ctx) => {
			expect(littleEndian.uint16(new Uint8Array([1, 2]), 0)).toBe(0x0201);
			await ctx.parameter('input', new Uint8Array([1, 2]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x0201');
		});

		await allure.step('excessive bytes', async (ctx) => {
			expect(littleEndian.uint16(new Uint8Array([1, 2, 3]), 0)).toBe(0x0201);
			await ctx.parameter('input', new Uint8Array([1, 2, 3]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x0201');
		});

		await allure.step('offset', async (ctx) => {
			expect(littleEndian.uint16(new Uint8Array([1, 2, 3]), 1)).toBe(0x0302);
			await ctx.parameter('input', new Uint8Array([1, 2, 3]).toString());
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', '0x0302');
		});

		await allure.step('throws error on insufficient bytes', async () => {
			expect(() => littleEndian.uint16(new Uint8Array([1]), 0)).toThrowError();
		});

		await allure.step('throws error on insufficient bytes with offset', async () => {
			expect(() => littleEndian.uint16(new Uint8Array([1, 2]), 1)).toThrowError();
		});
	});

	test('littleEndian.uint32()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('littleEndian.uint32()');
		await allure.tags(...sharedTags);

		await allure.step('returns correct value', async (ctx) => {
			expect(littleEndian.uint32(new Uint8Array([1, 2, 3, 4]), 0)).toBe(0x04030201);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x04030201');
		});

		await allure.step('excessive bytes', async (ctx) => {
			expect(littleEndian.uint32(new Uint8Array([1, 2, 3, 4, 5]), 0)).toBe(0x04030201);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4, 5]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x04030201');
		});

		await allure.step('offset', async (ctx) => {
			expect(littleEndian.uint32(new Uint8Array([1, 2, 3, 4, 5]), 1)).toBe(0x05040302);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4, 5]).toString());
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', '0x05040302');
		});

		await allure.step('throws error on insufficient bytes', async () => {
			expect(() => littleEndian.uint32(new Uint8Array([1]), 0)).toThrowError();
		});

		await allure.step('throws error on insufficient bytes with offset', async () => {
			expect(() => littleEndian.uint32(new Uint8Array([1, 2, 3, 4]), 1)).toThrowError();
		});
	});

	test('littleEndian.uint64()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('littleEndian.uint64()');
		await allure.tags(...sharedTags);

		await allure.step('returns correct value', async (ctx) => {
			expect(littleEndian.uint64(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), 0)).toBe(
				0x0807060504030201n
			);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x0807060504030201n');
		});

		await allure.step('excessive bytes', async (ctx) => {
			expect(littleEndian.uint64(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), 0)).toBe(
				0x0807060504030201n
			);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]).toString());
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', '0x0807060504030201n');
		});

		await allure.step('offset', async (ctx) => {
			expect(littleEndian.uint64(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), 1)).toBe(
				0x0908070605040302n
			);
			await ctx.parameter('input', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]).toString());
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', '0x0908070605040302n');
		});

		await allure.step('throws error on insufficient bytes', async () => {
			expect(() => littleEndian.uint64(new Uint8Array([1]), 0)).toThrowError();
		});

		await allure.step('throws error on insufficient bytes with offset', async () => {
			expect(() => littleEndian.uint64(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), 1)).toThrowError();
		});
	});

	test('littleEndian.putUint8()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('littleEndian.putUint8()');
		await allure.tags(...sharedTags);

		await allure.step('sets correct value', async (ctx) => {
			const data = new Uint8Array(1);
			littleEndian.putUint8(data, 1, 0);
			expect(data).toStrictEqual(new Uint8Array([1]));
			await ctx.parameter('value', String(1));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([1]).toString());
		});

		await allure.step('excessive bytes', async (ctx) => {
			const data = new Uint8Array(2);
			littleEndian.putUint8(data, 1, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 0]));
			await ctx.parameter('value', String(1));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([1, 0]).toString());
		});

		await allure.step('offset', async (ctx) => {
			const data = new Uint8Array(2);
			littleEndian.putUint8(data, 1, 1);
			expect(data).toStrictEqual(new Uint8Array([0, 1]));
			await ctx.parameter('value', String(1));
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', new Uint8Array([0, 1]).toString());
		});

		await allure.step('insufficient space', async () => {
			const data = new Uint8Array(0);
			expect(() => littleEndian.putUint8(data, 1, 0)).toThrow();
		});

		await allure.step('insufficient space with offset', async () => {
			const data = new Uint8Array(1);
			expect(() => littleEndian.putUint8(data, 1, 1)).toThrow();
		});
	});

	test('littleEndian.putUint16()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('littleEndian.putUint16()');
		await allure.tags(...sharedTags);

		await allure.step('sets correct value', async (ctx) => {
			const data = new Uint8Array(2);
			littleEndian.putUint16(data, 258, 0);
			expect(data).toStrictEqual(new Uint8Array([2, 1]));
			await ctx.parameter('value', String(258));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([2, 1]).toString());
		});

		await allure.step('excessive bytes', async (ctx) => {
			const data = new Uint8Array(3);
			littleEndian.putUint16(data, 258, 0);
			expect(data).toStrictEqual(new Uint8Array([2, 1, 0]));
			await ctx.parameter('value', String(258));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([2, 1, 0]).toString());
		});

		await allure.step('offset', async (ctx) => {
			const data = new Uint8Array(3);
			littleEndian.putUint16(data, 258, 1);
			expect(data).toStrictEqual(new Uint8Array([0, 2, 1]));
			await ctx.parameter('value', String(258));
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', new Uint8Array([0, 2, 1]).toString());
		});

		await allure.step('insufficient space', async () => {
			const data = new Uint8Array(0);
			expect(() => littleEndian.putUint16(data, 1, 0)).toThrow();
		});

		await allure.step('insufficient space with offset', async () => {
			const data = new Uint8Array(2);
			expect(() => littleEndian.putUint16(data, 258, 1)).toThrow();
		});
	});

	test('littleEndian.putUint32()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('littleEndian.putUint32()');
		await allure.tags(...sharedTags);

		await allure.step('sets correct value', async (ctx) => {
			const data = new Uint8Array(4);
			littleEndian.putUint32(data, 16909060, 0);
			expect(data).toStrictEqual(new Uint8Array([4, 3, 2, 1]));
			await ctx.parameter('value', String(16909060));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([4, 3, 2, 1]).toString());
		});

		await allure.step('excessive bytes', async (ctx) => {
			const data = new Uint8Array(5);
			littleEndian.putUint32(data, 16909060, 0);
			expect(data).toStrictEqual(new Uint8Array([4, 3, 2, 1, 0]));
			await ctx.parameter('value', String(16909060));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([4, 3, 2, 1, 0]).toString());
		});

		await allure.step('offset', async (ctx) => {
			const data = new Uint8Array(5);
			littleEndian.putUint32(data, 16909060, 1);
			expect(data).toStrictEqual(new Uint8Array([0, 4, 3, 2, 1]));
			await ctx.parameter('value', String(16909060));
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', new Uint8Array([0, 4, 3, 2, 1]).toString());
		});

		await allure.step('insufficient space', async () => {
			const data = new Uint8Array(0);
			expect(() => littleEndian.putUint32(data, 1, 0)).toThrow();
		});

		await allure.step('insufficient space with offset', async () => {
			const data = new Uint8Array(4);
			expect(() => littleEndian.putUint32(data, 16909060, 1)).toThrow();
		});
	});

	test('littleEndian.putUint64()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('littleEndian.putUint64()');
		await allure.tags(...sharedTags);

		await allure.step('sets correct value', async (ctx) => {
			const data = new Uint8Array(8);
			littleEndian.putUint64(data, 72623859790382856n, 0);
			expect(data).toStrictEqual(new Uint8Array([8, 7, 6, 5, 4, 3, 2, 1]));
			await ctx.parameter('value', String(72623859790382856n));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([8, 7, 6, 5, 4, 3, 2, 1]).toString());
		});

		await allure.step('excessive bytes', async (ctx) => {
			const data = new Uint8Array(9);
			littleEndian.putUint64(data, 72623859790382856n, 0);
			expect(data).toStrictEqual(new Uint8Array([8, 7, 6, 5, 4, 3, 2, 1, 0]));
			await ctx.parameter('value', String(72623859790382856n));
			await ctx.parameter('offset', String(0));
			await ctx.parameter('expected', new Uint8Array([8, 7, 6, 5, 4, 3, 2, 1, 0]).toString());
		});

		await allure.step('offset', async (ctx) => {
			const data = new Uint8Array(9);
			littleEndian.putUint64(data, 72623859790382856n, 1);
			expect(data).toStrictEqual(new Uint8Array([0, 8, 7, 6, 5, 4, 3, 2, 1]));
			await ctx.parameter('value', String(72623859790382856n));
			await ctx.parameter('offset', String(1));
			await ctx.parameter('expected', new Uint8Array([0, 8, 7, 6, 5, 4, 3, 2, 1]).toString());
		});

		await allure.step('insufficient space', async () => {
			const data = new Uint8Array(0);
			expect(() => littleEndian.putUint64(data, 72623859790382856n, 0)).toThrow();
		});

		await allure.step('insufficient space with offset', async () => {
			const data = new Uint8Array(8);
			expect(() => littleEndian.putUint64(data, 72623859790382856n, 1)).toThrow();
		});
	});
});
