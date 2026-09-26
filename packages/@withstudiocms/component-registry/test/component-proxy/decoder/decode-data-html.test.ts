import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { htmlDecodeTree } from '../../../src/component-proxy/decoder/decode-data-html.js';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Component Proxy Tests';

describe(parentSuiteName, () => {
	test('decode-data-html - htmlDecodeTree structure and content', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decode-data-html Tests');
		await allure.tags(...sharedTags);

		await allure.step('Verify htmlDecodeTree structure and content', async () => {
			// Test the structure of htmlDecodeTree
			expect(htmlDecodeTree).toBeDefined();
			expect(htmlDecodeTree).toBeInstanceOf(Uint16Array);
		});
	});

	test('decode-data-html - htmlDecodeTree properties', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decode-data-html Tests');
		await allure.tags(...sharedTags);

		await allure.step('Verify htmlDecodeTree properties', async () => {
			expect(htmlDecodeTree.length).toBeGreaterThan(0);
			for (let i = 0; i < htmlDecodeTree.length; i++) {
				expect(typeof htmlDecodeTree[i]).toBe('number');
				expect(htmlDecodeTree[i]).toBeGreaterThanOrEqual(0);
				expect(htmlDecodeTree[i]).toBeLessThanOrEqual(0xffff);
			}
		});
	});
});
