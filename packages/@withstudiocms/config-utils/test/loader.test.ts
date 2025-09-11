import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	bundleConfigFile,
	importBundledFile,
	loadAndBundleConfigFile,
	loadConfigFile,
} from '../src/loader.js';

const testDir = join(tmpdir(), `config-loader-test-${Date.now()}`);
const testDirUrl = new URL(`file://${testDir}/`);

if (existsSync(testDir)) {
	throw new Error(`Test directory already exists: ${testDir}`);
}

beforeAll(async () => {
	await mkdir(testDir, { recursive: true });
});

afterAll(async () => {
	await rm(testDir, { recursive: true, force: true });
});

describe('Config Loader Utils', () => {
	describe('bundleConfigFile', () => {
		it('should bundle a simple JavaScript config file', async () => {
			const configPath = join(testDir, 'simple.config.js');
			const configContent = `
            export default {
                name: 'test-config',
                value: 42
            };
        `;
			await writeFile(configPath, configContent, 'utf8');

			const result = await bundleConfigFile({
				fileUrl: new URL(`file://${configPath}`),
			});

			expect(result.code).toBeTypeOf('string');
			expect(Array.isArray(result.dependencies)).toBe(true);
			expect(result.code).toContain('test-config');
		});

		it('should bundle a TypeScript config file', async () => {
			const configPath = join(testDir, 'typescript.config.ts');
			const configContent = `
            interface Config {
                name: string;
                value: number;
            }
            
            const config: Config = {
                name: 'typescript-config',
                value: 123
            };
            
            export default config;
        `;
			await writeFile(configPath, configContent, 'utf8');

			const result = await bundleConfigFile({
				fileUrl: new URL(`file://${configPath}`),
			});

			expect(result.code).toBeTypeOf('string');
			expect(result.code).toContain('typescript-config');
		});

		it('should handle config with external imports', async () => {
			const configPath = join(testDir, 'external.config.js');
			const configContent = `
            import { join } from 'node:path';
            
            export default {
                name: 'external-config',
                testPath: join('test', 'path')
            };
        `;
			await writeFile(configPath, configContent, 'utf8');

			const result = await bundleConfigFile({
				fileUrl: new URL(`file://${configPath}`),
			});

			expect(result.code).toBeTypeOf('string');
			expect(result.dependencies.length).toBeGreaterThan(0);
			expect(result.code).toContain('external-config');
		});
	});

	describe('importBundledFile', () => {
		it('should import bundled code and return module', async () => {
			const code = `
            export default {
                imported: true,
                timestamp: Date.now()
            };
        `;

			const result = await importBundledFile({
				code,
				root: testDirUrl,
				label: 'test-import',
			});

			expect(result.default).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.default.imported).toBe(true);
			// @ts-expect-error - Testing dynamic property
			expect(typeof result.default.timestamp).toBe('number');
		});

		it('should successfully import and handle cleanup', async () => {
			const code = `export default { cleanup: 'test' };`;
			const result = await importBundledFile({
				code,
				root: testDirUrl,
				label: 'cleanup-test',
			});
			expect(result.default).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.default.cleanup).toBe('test');
		});
	});

	describe('loadAndBundleConfigFile', () => {
		it('should return empty result when no fileUrl is provided', async () => {
			const result = await loadAndBundleConfigFile({
				root: testDirUrl,
				fileUrl: undefined,
				label: 'empty-test',
			});

			expect(result.mod).toBeUndefined();
			expect(result.dependencies).toEqual([]);
		});

		it('should load and bundle a config file', async () => {
			const configPath = join(testDir, 'load-bundle.config.js');
			const configContent = `
            export default {
                loaded: true,
                bundled: true
            };
        `;
			await writeFile(configPath, configContent, 'utf8');

			const result = await loadAndBundleConfigFile({
				root: testDirUrl,
				fileUrl: new URL(`file://${configPath}`),
				label: 'load-bundle-test',
			});

			expect(result.mod).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.mod.default.loaded).toBe(true);
			// @ts-expect-error - Testing dynamic property
			expect(result.mod.default.bundled).toBe(true);
			expect(Array.isArray(result.dependencies)).toBe(true);
		});
	});

	describe('loadConfigFile', () => {
		it('should return undefined when no config files exist', async () => {
			const result = await loadConfigFile(
				testDirUrl,
				['nonexistent1.config.js', 'nonexistent2.config.ts'],
				'missing-test'
			);

			expect(result).toBeUndefined();
		});

		it('should load the first existing config file', async () => {
			const config1Path = join(testDir, 'first.config.js');
			const config2Path = join(testDir, 'second.config.js');

			const config1Content = `export default { order: 'first' };`;
			const config2Content = `export default { order: 'second' };`;

			await writeFile(config1Path, config1Content, 'utf8');
			await writeFile(config2Path, config2Content, 'utf8');

			const result = await loadConfigFile(
				testDirUrl,
				['nonexistent.config.js', 'first.config.js', 'second.config.js'],
				'order-test'
			);

			expect(result).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.order).toBe('first');
		});

		it('should throw error when config file has no default export', async () => {
			const configPath = join(testDir, 'no-default.config.js');
			const configContent = `
            export const namedExport = { value: 'named' };
            // No default export
        `;
			await writeFile(configPath, configContent, 'utf8');

			await expect(
				loadConfigFile(testDirUrl, ['no-default.config.js'], 'no-default-test')
			).rejects.toThrow(
				'Missing or invalid default export. Please export your config object as the default export.'
			);
		});

		it('should load TypeScript config file', async () => {
			const configPath = join(testDir, 'typescript-load.config.ts');
			const configContent = `
            interface TestConfig {
                name: string;
                features: string[];
            }
            
            const config: TestConfig = {
                name: 'typescript-test',
                features: ['bundling', 'loading', 'typescript']
            };
            
            export default config;
        `;
			await writeFile(configPath, configContent, 'utf8');

			const result = await loadConfigFile(testDirUrl, ['typescript-load.config.ts'], 'ts-test');

			expect(result).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.name).toBe('typescript-test');
			// @ts-expect-error - Testing dynamic property
			expect(Array.isArray(result.features)).toBe(true);
			// @ts-expect-error - Testing dynamic property
			expect(result.features).toContain('typescript');
		});

		it('should handle config file with complex exports', async () => {
			const configPath = join(testDir, 'complex.config.js');
			const configContent = `
            const baseConfig = {
                environment: 'test',
                database: {
                    host: 'localhost',
                    port: 5432
                }
            };
            
            const features = ['feature1', 'feature2'];
            
            export default {
                ...baseConfig,
                features,
                computed: features.length,
                timestamp: Date.now()
            };
        `;
			await writeFile(configPath, configContent, 'utf8');

			const result = await loadConfigFile(testDirUrl, ['complex.config.js'], 'complex-test');

			expect(result).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.environment).toBe('test');
			// @ts-expect-error - Testing dynamic property
			expect(result.database.host).toBe('localhost');
			// @ts-expect-error - Testing dynamic property
			expect(result.database.port).toBe(5432);
			// @ts-expect-error - Testing dynamic property
			expect(result.features).toEqual(['feature1', 'feature2']);
			// @ts-expect-error - Testing dynamic property
			expect(result.computed).toBe(2);
			// @ts-expect-error - Testing dynamic property
			expect(typeof result.timestamp).toBe('number');
		});
	});
});
