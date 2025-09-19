import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { getFileSizeInKilobytes } from '../../../src/integrations/robots/utils';

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
