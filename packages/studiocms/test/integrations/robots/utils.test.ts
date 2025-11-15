import fs from 'node:fs';
import * as allure from 'allure-js-commons';
import { afterEach, beforeEach, describe, expect, type Mock, test, vi } from 'vitest';
import {
	getFileSizeInKilobytes,
	measureExecutionTime,
} from '../../../src/integrations/robots/utils';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Robots Utils';

describe(parentSuiteName, () => {
	const mockStats = { size: 2048 }; // 2 KB

	beforeEach(() => {
		vi.spyOn(fs, 'statSync').mockImplementation(() => mockStats as fs.Stats);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('getFileSizeInKilobytes returns correct size', async () => {
		const tags = [...sharedTags, 'integration:robots', 'robots:utils'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getFileSizeInKilobytes test');
		await allure.tags(...tags);

		const fileUrl = new URL('file:///tmp/test.txt');
		const size = getFileSizeInKilobytes(fileUrl);
		expect(size).toBe(2);
	});

	test('getFileSizeInKilobytes returns fractional for non-exact sizes', async () => {
		const tags = [...sharedTags, 'integration:robots', 'robots:utils'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getFileSizeInKilobytes fractional size test');
		await allure.tags(...tags);

		(fs.statSync as unknown as Mock).mockReturnValueOnce({ size: 1500 });
		const fileUrl = new URL('file:///tmp/test.txt');
		const size = getFileSizeInKilobytes(fileUrl);
		expect(size).toBeCloseTo(1500 / 1024, 5);
	});

	test('getFileSizeInKilobytes throws if statSync fails', async () => {
		const tags = [...sharedTags, 'integration:robots', 'robots:utils'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('getFileSizeInKilobytes error handling test');
		await allure.tags(...tags);

		(fs.statSync as unknown as Mock).mockImplementationOnce(() => {
			throw new Error('File not found');
		});
		const fileUrl = new URL('file:///tmp/missing.txt');
		expect(() => getFileSizeInKilobytes(fileUrl)).toThrow('File not found');
	});

	[
		{
			callback: () => {
				for (let i = 0; i < 100000; i++) {} // Some work
			},
			expected: {
				min: 0,
			},
		},
		{
			callback: () => {},
			expected: {
				min: 0,
				max: 5,
			},
		},
		{
			callback: () => {
				const start = performance.now();
				while (performance.now() - start < 20) {} // Busy wait ~20ms
			},
			expected: {
				min: 15,
			},
		},
	].forEach(({ callback, expected }, index) => {
		const testName = `measureExecutionTime test case #${index + 1}`;
		const tags = [...sharedTags, 'integration:robots', 'robots:utils'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('measureExecutionTime test cases');
			await allure.tags(...tags);

			const time = measureExecutionTime(callback);
			expect(typeof time).toBe('number');
			expect(time).toBeGreaterThanOrEqual(expected.min);
			if (expected.max !== undefined) {
				expect(time).toBeLessThanOrEqual(expected.max);
			}
		});
	});
});
