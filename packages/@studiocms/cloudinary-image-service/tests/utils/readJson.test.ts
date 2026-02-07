import fs from 'node:fs';
import path from 'node:path';
import * as allure from 'allure-js-commons';
import { afterEach, describe, expect, it, test, vi } from 'vitest';
import { readJson } from '../../src/utils/readJson.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'readJson Utility Function Tests';

// Mock fs module
vi.mock('node:fs', () => {
	const readFileSync = vi.fn();
	return {
		readFileSync,
		default: { readFileSync },
	};
});

describe(parentSuiteName, () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('should read and parse JSON file successfully', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('readJson Functionality Tests');
		await allure.tags(...sharedTags);

		await allure.step('Reading and parsing valid JSON file', async (ctx) => {
			const mockData = { name: 'test-package', version: '1.0.0' };
			const mockJsonString = JSON.stringify(mockData);

			await ctx.parameter('Mock JSON Content', mockJsonString);

			vi.mocked(fs.readFileSync).mockReturnValue(mockJsonString);

			const result = readJson<typeof mockData>('/path/to/package.json');

			await ctx.parameter('Parsed JSON Result', JSON.stringify(result, null, 2));

			expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/package.json', 'utf-8');
			expect(result).toEqual(mockData);
		});
	});

	test('should handle URL paths', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('readJson Functionality Tests');
		await allure.tags(...sharedTags);

		await allure.step('Reading and parsing JSON file from URL path', async (ctx) => {
			const mockData = { name: 'test-package', version: '1.0.0' };
			const mockJsonString = JSON.stringify(mockData);
			const url = new URL('file:///path/to/package.json');

			await ctx.parameter('Mock JSON Content', mockJsonString);
			await ctx.parameter('File URL', url.toString());

			vi.mocked(fs.readFileSync).mockReturnValue(mockJsonString);

			const result = readJson<typeof mockData>(url);

			await ctx.parameter('Parsed JSON Result', JSON.stringify(result, null, 2));

			expect(fs.readFileSync).toHaveBeenCalledWith(url, 'utf-8');
			expect(result).toEqual(mockData);
		});
	});

	test('should throw error when JSON is invalid', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('readJson Functionality Tests');
		await allure.tags(...sharedTags);

		await allure.step('Reading and parsing invalid JSON file', async (ctx) => {
			const invalidJsonString = '{ invalid json }';

			await ctx.parameter('Invalid JSON Content', invalidJsonString);

			vi.mocked(fs.readFileSync).mockReturnValue(invalidJsonString);

			expect(() => {
				readJson('/path/to/invalid.json');
			}).toThrow();
		});
	});

	test('should throw error when file does not exist', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('readJson Functionality Tests');
		await allure.tags(...sharedTags);

		await allure.step('Attempting to read non-existent JSON file', async (ctx) => {
			await ctx.parameter('File Path', '/path/to/nonexistent.json');
			vi.mocked(fs.readFileSync).mockImplementation(() => {
				throw new Error('ENOENT: no such file or directory');
			});

			expect(() => {
				readJson('/path/to/nonexistent.json');
			}).toThrow('ENOENT: no such file or directory');
		});
	});

	test('should handle empty JSON object', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('readJson Functionality Tests');
		await allure.tags(...sharedTags);

		await allure.step('Reading and parsing empty JSON object', async (ctx) => {
			const emptyObject = {};
			const mockJsonString = JSON.stringify(emptyObject);

			await ctx.parameter('Mock JSON Content', mockJsonString);

			vi.mocked(fs.readFileSync).mockReturnValue(mockJsonString);

			const result = readJson<typeof emptyObject>('/path/to/empty.json');

			await ctx.parameter('Parsed JSON Result', JSON.stringify(result, null, 2));

			expect(result).toEqual(emptyObject);
		});
	});

	test('should handle complex nested JSON structures', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('readJson Functionality Tests');
		await allure.tags(...sharedTags);

		await allure.step('Reading and parsing complex nested JSON structure', async (ctx) => {
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

			await ctx.parameter('Mock JSON Content', mockJsonString);

			vi.mocked(fs.readFileSync).mockReturnValue(mockJsonString);

			const result = readJson<typeof complexData>('/path/to/complex.json');

			await ctx.parameter('Parsed JSON Result', JSON.stringify(result, null, 2));

			expect(result).toEqual(complexData);
			expect(result.dependencies).toEqual(complexData.dependencies);
			expect(result.scripts).toEqual(complexData.scripts);
			expect(result.keywords).toEqual(complexData.keywords);
		});
	});
});
