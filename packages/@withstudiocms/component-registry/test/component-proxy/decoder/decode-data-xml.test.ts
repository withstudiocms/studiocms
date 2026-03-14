import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { xmlDecodeTree } from '../../../src/component-proxy/decoder/decode-data-xml.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Component Proxy Tests';

describe(parentSuiteName, () => {
	test('decode-data-xml - xmlDecodeTree structure', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decode-data-xml Tests');
		await allure.tags(...sharedTags);

		await allure.step('Verify xmlDecodeTree structure', async () => {
			// Test the structure of xmlDecodeTree
			expect(xmlDecodeTree).toBeDefined();
		});

		await allure.step('Verify xmlDecodeTree content', async () => {
			expect(xmlDecodeTree).toBeInstanceOf(Uint16Array);
		});
	});

	test('decode-data-xml - should have the expected length', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decode-data-xml Tests');
		await allure.tags(...sharedTags);

		await allure.step('Check length of xmlDecodeTree', async () => {
			// The length should match the number of characters in the string
			const expectedLength =
				'\u0200aglq\t\x15\x18\x1b\u026d\x0f\0\0\x12p;\u4026os;\u4027t;\u403et;\u403cuot;\u4022'
					.length;
			expect(xmlDecodeTree.length).toBe(expectedLength);
		});
	});

	test('decode-data-xml - should contain the correct char codes', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decode-data-xml Tests');
		await allure.tags(...sharedTags);

		await allure.step('Verify char codes in xmlDecodeTree', async () => {
			const source =
				'\u0200aglq\t\x15\x18\x1b\u026d\x0f\0\0\x12p;\u4026os;\u4027t;\u403et;\u403cuot;\u4022';
			const expected = Array.from(source).map((c) => c.charCodeAt(0));
			expect(Array.from(xmlDecodeTree)).toEqual(expected);
		});
	});
});
