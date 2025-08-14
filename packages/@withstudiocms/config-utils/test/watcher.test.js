import assert from 'node:assert';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { exists, findConfig } from '../dist/watcher.js';

// Create a temporary directory for testing
const testDir = mkdtempSync(join(tmpdir(), 'watcher-test-'));

after(() => {
    rmSync(testDir, { recursive: true, force: true });
});

describe('Watcher Utils', () => {
    describe('exists', () => {
        it('returns false if path is undefined', () => {
            assert.strictEqual(exists(undefined), false);
        });

        it('returns true if file exists', () => {
            const testFile = join(testDir, 'exists-test.txt');
            writeFileSync(testFile, 'test');

            assert.strictEqual(exists(testFile), true);

            unlinkSync(testFile);
        });

        it('returns false if file does not exist', () => {
            const nonExistentFile = join(testDir, 'does-not-exist.txt');
            assert.strictEqual(exists(nonExistentFile), false);
        });
    });

    describe('findConfig', () => {
        const projectRootUrl = `${testDir}/`;

        it('returns undefined if configPaths is empty', () => {
            assert.strictEqual(findConfig(projectRootUrl, []), undefined);
        });

        it('returns the first configUrl that exists', () => {
            const configPaths = ['a.js', 'b.js', 'c.js'];

            // Create only b.js
            const bPath = join(testDir, 'b.js');
            writeFileSync(bPath, 'module.exports = {};');

            assert.strictEqual(findConfig(projectRootUrl, configPaths), `${projectRootUrl}b.js`);

            unlinkSync(bPath);
        });

        it('returns undefined if none of the config files exist', () => {
            const configPaths = ['nonexistent1.js', 'nonexistent2.js', 'nonexistent3.js'];
            assert.strictEqual(findConfig(projectRootUrl, configPaths), undefined);
        });

        it('returns the first configUrl if multiple exist', () => {
            const configPaths = ['a.js', 'b.js', 'c.js'];

            // Create both a.js and b.js
            const aPath = join(testDir, 'a.js');
            const bPath = join(testDir, 'b.js');
            writeFileSync(aPath, 'module.exports = {};');
            writeFileSync(bPath, 'module.exports = {};');

            assert.strictEqual(findConfig(projectRootUrl, configPaths), `${projectRootUrl}a.js`);

            unlinkSync(aPath);
            unlinkSync(bPath);
        });
    });
});
