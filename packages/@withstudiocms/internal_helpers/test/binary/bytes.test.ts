import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { compareBytes, concatenateBytes, DynamicBuffer } from '../../src/binary/bytes.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'binary/bytes';

describe(parentSuiteName, () => {
  test('compareBytes()', async () => {
    await allure.parentSuite(parentSuiteName);
    await allure.suite(localSuiteName);
    await allure.subSuite('compareBytes()');
    await allure.tags(...sharedTags);

    await allure.step('compareBytes()', async (ctx) => {
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      expect(compareBytes(randomBytes, randomBytes)).toBe(true);
      const anotherRandomBytes = new Uint8Array(32);
      crypto.getRandomValues(anotherRandomBytes);
      expect(compareBytes(randomBytes, anotherRandomBytes)).toBe(false);
      expect(compareBytes(new Uint8Array(0), new Uint8Array(1))).toBe(false);

      await ctx.parameter('randomBytes', randomBytes.toString());
      await ctx.parameter('anotherRandomBytes', anotherRandomBytes.toString());
    });
  });

  test('concatenateBytes()', async () => {
    await allure.parentSuite(parentSuiteName);
    await allure.suite(localSuiteName);
    await allure.subSuite('concatenateBytes()');
    await allure.tags(...sharedTags);

    await allure.step('concatenateBytes()', async (ctx) => {
      const a = new Uint8Array([0, 1]);
      const b = new Uint8Array([2, 3, 4]);
      expect(concatenateBytes(a, b)).toStrictEqual(new Uint8Array([0, 1, 2, 3, 4]));

      await ctx.parameter('a', a.toString());
      await ctx.parameter('b', b.toString());
      await ctx.parameter('expected', new Uint8Array([0, 1, 2, 3, 4]).toString());
    });
  });

  test('DynamicBuffer', async () => {
    await allure.parentSuite(parentSuiteName);
    await allure.suite(localSuiteName);
    await allure.subSuite('DynamicBuffer.write()');
    await allure.tags(...sharedTags);

    await allure.step('DynamicBuffer.write()', async (ctx) => {
      const buffer = new DynamicBuffer(0);
      buffer.write(new Uint8Array([0x01]));
      expect(buffer.bytes()).toStrictEqual(new Uint8Array([0x01]));
      buffer.write(new Uint8Array(100));
      expect(buffer.capacity).toStrictEqual(128);
      expect(buffer.bytes()).toStrictEqual(new Uint8Array([0x01, ...new Uint8Array(100)]));
      buffer.write(new Uint8Array(27));
      expect(buffer.length).toStrictEqual(128);
      expect(buffer.capacity).toStrictEqual(128);

      await ctx.parameter('buffer', buffer.bytes().toString());
    });
  });

  test('DynamicBuffer', async () => {
    await allure.parentSuite(parentSuiteName);
    await allure.suite(localSuiteName);
    await allure.subSuite('DynamicBuffer.writeByte()');
    await allure.tags(...sharedTags);

    await allure.step('DynamicBuffer.writeByte()', async (ctx) => {
      const buffer = new DynamicBuffer(0);
      buffer.writeByte(0x01);
      expect(buffer.bytes()).toStrictEqual(new Uint8Array([0x01]));
      buffer.writeByte(0x02);
      buffer.writeByte(0x03);
      buffer.writeByte(0x04);
      expect(buffer.capacity).toBe(4);
      expect(buffer.bytes()).toStrictEqual(new Uint8Array([0x01, 0x02, 0x03, 0x04]));

      await ctx.parameter('buffer', buffer.bytes().toString());
    });
  });
});
