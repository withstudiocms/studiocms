import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, type Mock, vi } from 'vitest';
import {
	getFileSizeInKilobytes,
	measureExecutionTime,
} from '../../../src/integrations/robots/utils';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'Robots Utils';

describe(parentSuiteName, () => {
	const mockStats = { size: 2048 }; // 2 KB
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	beforeEach(() => {
		vi.spyOn(fs, 'statSync').mockImplementation(() => mockStats as fs.Stats);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('getFileSizeInKilobytes returns correct size', async ({ setupAllure }) => {
		const tags = [...sharedTags, 'integration:robots', 'robots:utils'];

		await setupAllure({
			subSuiteName: 'getFileSizeInKilobytes test',
			tags: [...tags],
		});

		const fileUrl = new URL('file:///tmp/test.txt');
		const size = getFileSizeInKilobytes(fileUrl);
		expect(size).toBe(2);
	});

	test('getFileSizeInKilobytes returns fractional for non-exact sizes', async ({ setupAllure }) => {
		const tags = [...sharedTags, 'integration:robots', 'robots:utils'];

		await setupAllure({
			subSuiteName: 'getFileSizeInKilobytes fractional size test',
			tags: [...tags],
		});

		(fs.statSync as unknown as Mock).mockReturnValueOnce({ size: 1500 });
		const fileUrl = new URL('file:///tmp/test.txt');
		const size = getFileSizeInKilobytes(fileUrl);
		expect(size).toBeCloseTo(1500 / 1024, 5);
	});

	test('getFileSizeInKilobytes throws if statSync fails', async ({ setupAllure }) => {
		const tags = [...sharedTags, 'integration:robots', 'robots:utils'];

		await setupAllure({
			subSuiteName: 'getFileSizeInKilobytes error handling test',
			tags: [...tags],
		});

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

		test(testName, async ({ setupAllure }) => {
			await setupAllure({
				subSuiteName: 'measureExecutionTime test cases',
				tags: [...tags],
			});

			const time = measureExecutionTime(callback);
			expect(typeof time).toBe('number');
			expect(time).toBeGreaterThanOrEqual(expected.min);
			if (expected.max !== undefined) {
				expect(time).toBeLessThanOrEqual(expected.max);
			}
		});
	});
});
