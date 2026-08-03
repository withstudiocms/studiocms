import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { bigIntBytes, bigIntFromBytes } from '../../src/binary/big.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'binary/big';

describe(parentSuiteName, () => {
  [
    {
      input: 1n,
      expected: new Uint8Array([0x01])
    },
    {
      input: 255n,
      expected: new Uint8Array([0xff])
    },
    {
      input: 256n,
      expected: new Uint8Array([0x01, 0x00])
    },
    {
      input: -256n,
      expected: new Uint8Array([0x01, 0x00])
    },
    {
      input: 5476057457410545405175640567415649081748931656501235026509713265394n,
      expected: new Uint8Array([
        0x33, 0xff, 0x8e, 0xec, 0x07, 0x9c, 0x46, 0x65, 0x7a, 0x20, 0xb5, 0xd4, 0xb4, 0x7d, 0xf6,
        0xb0, 0x59, 0xca, 0x46, 0xb4, 0x4b, 0xfa, 0xae, 0x0d, 0x3b, 0xf6, 0x52, 0xf2
      ])
    }
  ].forEach(({ input, expected }) => {
    test(`bigIntBytes(${input})`, async () => {
      await allure.parentSuite(parentSuiteName);
      await allure.suite(localSuiteName);
      await allure.subSuite("bigIntBytes()");
      await allure.tags(...sharedTags);

      await allure.step(`bigIntBytes(${input})`, async (ctx) => {
        expect(bigIntBytes(input)).toStrictEqual(expected);
        await ctx.parameter('input', input.toString());
        await ctx.parameter('expected', expected.toString());
      });
    });

    test(`bigIntFromBytes(${expected})`, async () => {
      await allure.parentSuite(parentSuiteName);
      await allure.suite(localSuiteName);
      await allure.subSuite("bigIntFromBytes()");
      await allure.tags(...sharedTags);

      await allure.step(`bigIntFromBytes(${expected})`, async (ctx) => {
        expect(bigIntFromBytes(expected)).toBe(input);
        await ctx.parameter('input', expected.toString());
        await ctx.parameter('expected', input.toString());
      });
    });
  });
});
