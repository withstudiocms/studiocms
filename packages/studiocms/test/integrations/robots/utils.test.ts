import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import {
	getFileSizeInKilobytes,
	measureExecutionTime,
} from '../../../src/integrations/robots/utils';

describe('getFileSizeInKilobytes', () => {
	const mockStats = { size: 2048 }; // 2 KB

	beforeEach(() => {
		vi.spyOn(fs, 'statSync').mockImplementation(() => mockStats as fs.Stats);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns correct kilobyte size for a file', () => {
		const fileUrl = new URL('file:///tmp/test.txt');
		const size = getFileSizeInKilobytes(fileUrl);
		expect(size).toBe(2);
	});

	it('returns fractional kilobytes for non-exact sizes', () => {
		(fs.statSync as unknown as Mock).mockReturnValueOnce({ size: 1500 });
		const fileUrl = new URL('file:///tmp/test.txt');
		const size = getFileSizeInKilobytes(fileUrl);
		expect(size).toBeCloseTo(1500 / 1024, 5);
	});

	it('throws if statSync fails', () => {
		(fs.statSync as unknown as Mock).mockImplementationOnce(() => {
			throw new Error('File not found');
		});
		const fileUrl = new URL('file:///tmp/missing.txt');
		expect(() => getFileSizeInKilobytes(fileUrl)).toThrow('File not found');
	});
});

describe('measureExecutionTime', () => {
	it('returns a non-negative number for a synchronous callback', () => {
		const time = measureExecutionTime(() => {
			for (let i = 0; i < 100000; i++) {} // Some work
		});
		expect(typeof time).toBe('number');
		expect(time).toBeGreaterThanOrEqual(0);
	});

	it('returns ~0 for an empty callback', () => {
		const time = measureExecutionTime(() => {});
		expect(time).toBeGreaterThanOrEqual(0);
		expect(time).toBeLessThan(5); // Should be very fast
	});

	it('measures longer execution for slow callbacks', () => {
		const time = measureExecutionTime(() => {
			const start = performance.now();
			while (performance.now() - start < 20) {} // Busy wait ~20ms
		});
		expect(time).toBeGreaterThanOrEqual(15);
	});
});
