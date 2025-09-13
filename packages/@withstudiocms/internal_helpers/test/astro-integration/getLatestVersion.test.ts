import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLatestVersion } from '../../src/astro-integration/index.js';

vi.mock('../utils/jsonUtils.js', () => ({
	jsonParse: vi.fn((v: string) => JSON.parse(v)),
}));

// Mocks
const mockLogger = {
	error: vi.fn(),
	// biome-ignore lint/suspicious/noExplicitAny: allowed in tests
} as any;

const mockFs = {
	readFileSync: vi.fn(),
	writeFileSync: vi.fn(),
};

const mockFetch = vi.fn();
// biome-ignore lint/suspicious/noExplicitAny: allowed in tests
(globalThis as any).fetch = mockFetch;

const FAKE_URL = new URL('file:///tmp/fake-cache.json');

describe('getLatestVersion', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('fetches latest version from npm and returns it', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ version: '1.2.3' }),
		});

		const version = await getLatestVersion('test-package', mockLogger, undefined, false, mockFs);

		expect(version).toBe('1.2.3');
		expect(mockLogger.error).not.toHaveBeenCalled();
		expect(mockFs.writeFileSync).not.toHaveBeenCalled();
	});

	it('returns cached version if dev mode and cache is fresh', async () => {
		const now = Date.now();
		const lastChecked = new Date(now - 30 * 60 * 1000).toISOString(); // 30 min ago
		mockFs.readFileSync.mockReturnValueOnce(
			JSON.stringify({
				latestVersionCheck: {
					lastChecked,
					version: '9.9.9',
				},
			})
		);

		const version = await getLatestVersion('test-package', mockLogger, FAKE_URL, true, mockFs);

		expect(version).toBe('9.9.9');
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('fetches and updates cache if dev mode and cache is stale', async () => {
		const now = Date.now();
		const lastChecked = new Date(now - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
		mockFs.readFileSync.mockReturnValueOnce(
			JSON.stringify({
				latestVersionCheck: {
					lastChecked,
					version: '0.0.1',
				},
			})
		);
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ version: '2.0.0' }),
		});

		const version = await getLatestVersion('test-package', mockLogger, FAKE_URL, true, mockFs);

		expect(version).toBe('2.0.0');
		expect(mockFs.writeFileSync).toHaveBeenCalled();
	});

	it('writes cache after fetching in dev mode', async () => {
		mockFs.readFileSync.mockReturnValueOnce('{}');
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ version: '3.3.3' }),
		});

		await getLatestVersion('test-package', mockLogger, FAKE_URL, true, mockFs);

		expect(mockFs.writeFileSync).toHaveBeenCalledWith(
			FAKE_URL,
			expect.stringContaining('"version": "3.3.3"'),
			'utf-8'
		);
	});

	it('returns null and logs error if fetch fails', async () => {
		mockFetch.mockRejectedValueOnce(new Error('network error'));

		const version = await getLatestVersion('test-package', mockLogger, undefined, false, mockFs);

		expect(version).toBeNull();
		expect(mockLogger.error).toHaveBeenCalledWith(
			expect.stringContaining('Error fetching latest version of test-package:')
		);
	});

	it('returns null and logs error if response is not ok', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found',
		});

		const version = await getLatestVersion('test-package', mockLogger, undefined, false, mockFs);

		expect(version).toBeNull();
		expect(mockLogger.error).toHaveBeenCalledWith(
			expect.stringContaining('Error fetching latest version of test-package:')
		);
	});
});
