import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as allure from 'allure-js-commons';
import { afterAll, describe, expect, test } from 'vitest';
import { exists, findConfig } from '../src/watcher.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Watcher Utility Tests';

// Create a temporary directory for testing
const testDir = mkdtempSync(join(tmpdir(), 'watcher-test-'));

afterAll(() => {
	rmSync(testDir, { recursive: true, force: true });
});

describe(parentSuiteName, () => {
	[
		{
			path: undefined,
			expected: false,
		},
		{
			testFile: true,
			path: join(testDir, 'exists-test.txt'),
			expected: true,
		},
		{
			path: join(testDir, 'nonexistent-file.txt'),
			expected: false,
		},
	].forEach(({ testFile, path, expected }) => {
		test('Watcher Utils - exists Tests', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('exists Test Set');
			await allure.tags(...sharedTags);

			await allure.parameter('path', path ?? 'undefined');
			await allure.parameter('expected', String(expected));
			await allure.parameter('testFile', String(!!testFile));

			if (testFile) {
				writeFileSync(path, 'test');
			}

			await allure.step(`Should return ${expected} for path: ${path}`, async (ctx) => {
				ctx.parameter('path', path ?? 'undefined');
				const result = exists(path);
				ctx.parameter('result', String(result));
				expect(result).toBe(expected);
			});

			if (testFile) {
				unlinkSync(path);
			}
		});
	});

	test('Watcher Utils - findConfig Tests', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('findConfig Test Set');
		await allure.tags(...sharedTags);

		await allure.step('Should return undefined if configPaths is empty', async (ctx) => {
			const result = findConfig(`${testDir}/`, []);
			ctx.parameter('result', String(result));
			expect(result).toBeUndefined();
		});

		await allure.step('Should return the first configUrl that exists', async (ctx) => {
			const configPaths = ['a.js', 'b.js', 'c.js'];

			await ctx.parameter('configPaths', JSON.stringify(configPaths));

			// Create only b.js
			const bPath = join(testDir, 'b.js');
			writeFileSync(bPath, 'module.exports = {};');

			const result = findConfig(`${testDir}/`, configPaths);

			await ctx.parameter('result', String(result));

			expect(result).toBe(`${testDir}/b.js`);

			unlinkSync(bPath);
		});

		await allure.step('Should return undefined if none of the config files exist', async (ctx) => {
			const configPaths = ['nonexistent1.js', 'nonexistent2.js', 'nonexistent3.js'];
			await ctx.parameter('configPaths', JSON.stringify(configPaths));
			const result = findConfig(`${testDir}/`, configPaths);
			await ctx.parameter('result', String(result));
			expect(result).toBeUndefined();
		});

		await allure.step('Should return the first configUrl if multiple exist', async (ctx) => {
			const configPaths = ['a.js', 'b.js', 'c.js'];

			await ctx.parameter('configPaths', JSON.stringify(configPaths));

			// Create both a.js and b.js
			const aPath = join(testDir, 'a.js');
			const bPath = join(testDir, 'b.js');
			writeFileSync(aPath, 'module.exports = {};');
			writeFileSync(bPath, 'module.exports = {};');

			const result = findConfig(`${testDir}/`, configPaths);
			await ctx.parameter('result', String(result));
			expect(result).toBe(`${testDir}/a.js`);

			unlinkSync(aPath);
			unlinkSync(bPath);
		});
	});
});
