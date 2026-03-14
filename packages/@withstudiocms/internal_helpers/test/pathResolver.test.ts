import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as allure from 'allure-js-commons';
import { beforeEach, describe, expect, test } from 'vitest';
import createPathResolver from '../src/pathResolver.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Path Resolver Tests';

describe(parentSuiteName, () => {
	let testFileUrl: string;
	let testFilePath: string;
	let testDirPath: string;

	beforeEach(() => {
		// Setup test paths
		testFilePath = path.join(process.cwd(), 'test', 'fixtures', 'test-file.js');
		testFileUrl = pathToFileURL(testFilePath).href;
		testDirPath = path.dirname(testFilePath);
	});

	test('should create resolver from file:// URL', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should create resolver from file:// URL');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(testFileUrl);
		expect(resolver).toHaveProperty('resolve');
		expect(resolver).toHaveProperty('resolveURL');
	});

	test('should resolve relative paths from the directory containing the file', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should resolve relative paths from the directory containing the file');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(testFileUrl);
		const result = resolver.resolve('assets', 'image.png');

		const expected = path.join(testDirPath, 'assets', 'image.png');
		expect(result).toBe(expected);
	});

	test('should resolve parent directory paths correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should resolve parent directory paths correctly');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(testFileUrl);
		const result = resolver.resolve('..', 'sibling', 'file.txt');

		const expected = path.join(testDirPath, '..', 'sibling', 'file.txt');
		expect(result).toBe(expected);
	});

	test('should resolveURL to return a file:// URL', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should resolveURL to return a file:// URL');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(testFileUrl);
		const result = resolver.resolveURL('assets', 'image.png');

		expect(result).toBeInstanceOf(URL);
		expect(result.protocol).toBe('file:');
		expect(result.href).toContain('assets');
		expect(result.href).toContain('image.png');
	});

	test('should handle single segment paths', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should handle single segment paths');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(testFileUrl);
		const result = resolver.resolve('config.json');

		const expected = path.join(testDirPath, 'config.json');
		expect(result).toBe(expected);
	});

	test('should handle empty segments', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should handle empty segments');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(testFileUrl);
		const result = resolver.resolve();

		expect(result).toBe(testDirPath);
	});

	test('should create resolver from process.cwd()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should create resolver from process.cwd()');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(process.cwd());
		const result = resolver.resolve('src', 'index.ts');

		const expected = path.join(process.cwd(), 'src', 'index.ts');
		expect(result).toBe(expected);
	});

	test('should create resolver from absolute path', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should create resolver from absolute path');
		await allure.tags(...sharedTags);

		const basePath = path.join(process.cwd(), 'src');
		const resolver = createPathResolver(basePath);
		const result = resolver.resolve('utils', 'helper.ts');

		const expected = path.join(basePath, 'utils', 'helper.ts');
		expect(result).toBe(expected);
	});

	test('should create resolver from relative path', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should create resolver from relative path');
		await allure.tags(...sharedTags);

		const relativePath = './src';
		const resolver = createPathResolver(relativePath);
		const result = resolver.resolve('index.ts');

		const expected = path.resolve(relativePath, 'index.ts');
		expect(result).toBe(expected);
	});

	test('should resolveURL with filesystem path base', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should resolveURL with filesystem path base');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(process.cwd());
		const result = resolver.resolveURL('src', 'index.ts');

		expect(result).toBeInstanceOf(URL);
		expect(result.protocol).toBe('file:');
		expect(fileURLToPath(result)).toBe(path.join(process.cwd(), 'src', 'index.ts'));
	});

	test('should handle paths with special characters', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should handle paths with special characters');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(process.cwd());
		const result = resolver.resolve('test-file', 'my file (1).txt');

		expect(result).toContain('my file (1).txt');
	});

	test('should handle multiple parent directory navigation', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should handle multiple parent directory navigation');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(testFileUrl);
		const result = resolver.resolve('..', '..', '..', 'root-level.txt');

		const expected = path.join(testDirPath, '..', '..', '..', 'root-level.txt');
		expect(result).toBe(expected);
	});

	test('should normalize paths correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should normalize paths correctly');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(process.cwd());
		const result = resolver.resolve('src', '.', 'utils', '..', 'index.ts');

		const expected = path.join(process.cwd(), 'src', 'index.ts');
		expect(result).toBe(expected);
	});

	test('should handle absolute path segments in resolve', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should handle absolute path segments in resolve');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(process.cwd());
		const absolutePath = path.join(process.cwd(), 'other', 'location');
		const result = resolver.resolve(absolutePath);

		// path.resolve with absolute path ignores base
		expect(result).toBe(absolutePath);
	});

	test('should produce consistent results between resolve and resolveURL', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should produce consistent results between resolve and resolveURL');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(process.cwd());
		const segments = ['src', 'utils', 'helper.ts'];

		const resolvedPath = resolver.resolve(...segments);
		const resolvedURL = resolver.resolveURL(...segments);

		expect(fileURLToPath(resolvedURL)).toBe(resolvedPath);
	});

	test('should work with both Windows and Unix-style paths', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('should work with both Windows and Unix-style paths');
		await allure.tags(...sharedTags);

		const resolver = createPathResolver(process.cwd());
		const result = resolver.resolve('src', 'utils', 'helper.ts');

		// Should always produce platform-appropriate separators
		expect(result).toBe(path.join(process.cwd(), 'src', 'utils', 'helper.ts'));
	});
});
