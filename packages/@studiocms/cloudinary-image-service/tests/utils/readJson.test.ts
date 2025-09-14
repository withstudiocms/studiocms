import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readJson } from '../../src/utils/readJson.js';

// Mock fs module
vi.mock('node:fs', () => ({
	default: {
		readFileSync: vi.fn(),
	},
}));

describe('readJson', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should read and parse JSON file successfully', () => {
		const mockData = { name: 'test-package', version: '1.0.0' };
		const mockJsonString = JSON.stringify(mockData);

		vi.mocked(fs.readFileSync).mockReturnValue(mockJsonString);

		const result = readJson<typeof mockData>('/path/to/package.json');

		expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/package.json', 'utf-8');
		expect(result).toEqual(mockData);
	});

	it('should handle URL paths', () => {
		const mockData = { name: 'test-package', version: '1.0.0' };
		const mockJsonString = JSON.stringify(mockData);
		const url = new URL('file:///path/to/package.json');

		vi.mocked(fs.readFileSync).mockReturnValue(mockJsonString);

		const result = readJson<typeof mockData>(url);

		expect(fs.readFileSync).toHaveBeenCalledWith(url, 'utf-8');
		expect(result).toEqual(mockData);
	});

	it('should throw error when JSON is invalid', () => {
		const invalidJsonString = '{ invalid json }';

		vi.mocked(fs.readFileSync).mockReturnValue(invalidJsonString);

		expect(() => {
			readJson('/path/to/invalid.json');
		}).toThrow();
	});

	it('should throw error when file does not exist', () => {
		vi.mocked(fs.readFileSync).mockImplementation(() => {
			throw new Error('ENOENT: no such file or directory');
		});

		expect(() => {
			readJson('/path/to/nonexistent.json');
		}).toThrow('ENOENT: no such file or directory');
	});

	it('should handle empty JSON object', () => {
		const emptyObject = {};
		const mockJsonString = JSON.stringify(emptyObject);

		vi.mocked(fs.readFileSync).mockReturnValue(mockJsonString);

		const result = readJson<typeof emptyObject>('/path/to/empty.json');

		expect(result).toEqual(emptyObject);
	});

	it('should handle complex nested JSON structures', () => {
		const complexData = {
			name: 'test-package',
			version: '1.0.0',
			dependencies: {
				'@cloudinary/url-gen': '^1.22.0',
				'astro-integration-kit': 'catalog:',
			},
			scripts: {
				build: 'buildkit build',
				dev: 'buildkit dev',
			},
			keywords: ['astro', 'cms', 'studiocms'],
		};
		const mockJsonString = JSON.stringify(complexData);

		vi.mocked(fs.readFileSync).mockReturnValue(mockJsonString);

		const result = readJson<typeof complexData>('/path/to/complex.json');

		expect(result).toEqual(complexData);
		expect(result.dependencies).toEqual(complexData.dependencies);
		expect(result.scripts).toEqual(complexData.scripts);
		expect(result.keywords).toEqual(complexData.keywords);
	});
});
