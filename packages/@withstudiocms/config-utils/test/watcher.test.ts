import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { exists, findConfig } from '../src/watcher.js';

// Create a temporary directory for testing
const testDir = mkdtempSync(join(tmpdir(), 'watcher-test-'));

afterAll(() => {
	rmSync(testDir, { recursive: true, force: true });
});

describe('Watcher Utils', () => {
	describe('exists', () => {
		it('returns false if path is undefined', () => {
			expect(exists(undefined)).toBe(false);
		});

		it('returns true if file exists', () => {
			const testFile = join(testDir, 'exists-test.txt');
			writeFileSync(testFile, 'test');

			expect(exists(testFile)).toBe(true);

			unlinkSync(testFile);
		});

		it('returns false if file does not exist', () => {
			const nonExistentFile = join(testDir, 'does-not-exist.txt');
			expect(exists(nonExistentFile)).toBe(false);
		});
	});

	describe('findConfig', () => {
		const projectRootUrl = `${testDir}/`;

		it('returns undefined if configPaths is empty', () => {
			expect(findConfig(projectRootUrl, [])).toBeUndefined();
		});

		it('returns the first configUrl that exists', () => {
			const configPaths = ['a.js', 'b.js', 'c.js'];

			// Create only b.js
			const bPath = join(testDir, 'b.js');
			writeFileSync(bPath, 'module.exports = {};');

			expect(findConfig(projectRootUrl, configPaths)).toBe(`${projectRootUrl}b.js`);

			unlinkSync(bPath);
		});

		it('returns undefined if none of the config files exist', () => {
			const configPaths = ['nonexistent1.js', 'nonexistent2.js', 'nonexistent3.js'];
			expect(findConfig(projectRootUrl, configPaths)).toBeUndefined();
		});

		it('returns the first configUrl if multiple exist', () => {
			const configPaths = ['a.js', 'b.js', 'c.js'];

			// Create both a.js and b.js
			const aPath = join(testDir, 'a.js');
			const bPath = join(testDir, 'b.js');
			writeFileSync(aPath, 'module.exports = {};');
			writeFileSync(bPath, 'module.exports = {};');

			expect(findConfig(projectRootUrl, configPaths)).toBe(`${projectRootUrl}a.js`);

			unlinkSync(aPath);
			unlinkSync(bPath);
		});
	});
});
