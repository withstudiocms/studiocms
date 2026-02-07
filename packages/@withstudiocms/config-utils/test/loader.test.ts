import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as allure from 'allure-js-commons';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
	bundleConfigFile,
	importBundledFile,
	loadAndBundleConfigFile,
	loadConfigFile,
} from '../src/loader.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Config Loader Tests';

const testDir = join(tmpdir(), `config-loader-test-${Date.now()}`);
const testDirUrl = new URL(`file://${testDir}/`);

if (existsSync(testDir)) {
	throw new Error(`Test directory already exists: ${testDir}`);
}

describe(parentSuiteName, () => {
	beforeAll(async () => {
		await mkdir(testDir, { recursive: true });
	});

	afterAll(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	test('Config Loader - bundleConfigFile', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('bundleConfigFile Tests');
		await allure.tags(...sharedTags);

		await allure.step('should bundle a simple javascript config file', async (ctx) => {
			const configPath = join(testDir, 'simple.config.js');
			const configContent = `
			export default {
				name: 'test-config',
				value: 42
			};
		`;

			await ctx.parameter('configPath', configPath);
			await ctx.parameter('configContent', configContent);

			await writeFile(configPath, configContent, 'utf8');

			const result = await bundleConfigFile({
				fileUrl: new URL(`file://${configPath}`),
			});

			await ctx.parameter('bundledCode', result.code);
			await ctx.parameter('dependencies', JSON.stringify(result.dependencies));

			expect(result.code).toBeTypeOf('string');
			expect(Array.isArray(result.dependencies)).toBe(true);
			expect(result.code).toContain('test-config');
		});

		await allure.step('should bundle a typescript config file', async (ctx) => {
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

			await ctx.parameter('configPath', configPath);
			await ctx.parameter('configContent', configContent);

			await writeFile(configPath, configContent, 'utf8');

			const result = await bundleConfigFile({
				fileUrl: new URL(`file://${configPath}`),
			});

			await ctx.parameter('bundledCode', result.code);
			await ctx.parameter('dependencies', JSON.stringify(result.dependencies));

			expect(result.code).toBeTypeOf('string');
			expect(result.code).toContain('typescript-config');
		});

		await allure.step('should handle config with external imports', async (ctx) => {
			const configPath = join(testDir, 'external.config.js');
			const configContent = `
			import { join } from 'node:path';

			export default {
				name: 'external-config',
				testPath: join('test', 'path')
			};
		`;
			await ctx.parameter('configPath', configPath);
			await ctx.parameter('configContent', configContent);

			await writeFile(configPath, configContent, 'utf8');

			const result = await bundleConfigFile({
				fileUrl: new URL(`file://${configPath}`),
			});

			await ctx.parameter('bundledCode', result.code);
			await ctx.parameter('dependencies', JSON.stringify(result.dependencies));

			expect(result.code).toBeTypeOf('string');
			expect(result.dependencies.length).toBeGreaterThan(0);
			expect(result.code).toContain('external-config');
		});
	});

	test('Config Loader - importBundledFile', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('importBundledFile Tests');
		await allure.tags(...sharedTags);

		await allure.step('should import bundled code and return module', async (ctx) => {
			const code = `
			export default {
				imported: true,
				timestamp: Date.now()
			};
		`;

			await ctx.parameter('bundledCode', code);

			const result = await importBundledFile({
				code,
				root: testDirUrl,
				label: 'test-import',
			});

			await ctx.parameter('importedModule', JSON.stringify(result));

			expect(result.default).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.default.imported).toBe(true);
			// @ts-expect-error - Testing dynamic property
			expect(typeof result.default.timestamp).toBe('number');
		});

		await allure.step('should successfully import and handle cleanup', async (ctx) => {
			const code = `export default { cleanup: 'test' };`;
			await ctx.parameter('bundledCode', code);

			const result = await importBundledFile({
				code,
				root: testDirUrl,
				label: 'cleanup-test',
			});
			await ctx.parameter('importedModule', JSON.stringify(result));

			expect(result.default).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.default.cleanup).toBe('test');
		});
	});

	test('Config Loader - loadAndBundleConfigFile', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('loadAndBundleConfigFile Tests');
		await allure.tags(...sharedTags);

		await allure.step('should return empty result when no fileUrl is provided', async (ctx) => {
			const result = await loadAndBundleConfigFile({
				root: testDirUrl,
				fileUrl: undefined,
				label: 'empty-test',
			});

			await ctx.parameter('resultModule', JSON.stringify(result.mod));
			await ctx.parameter('resultDependencies', JSON.stringify(result.dependencies));

			expect(result.mod).toBeUndefined();
			expect(result.dependencies).toEqual([]);
		});

		await allure.step('should load and bundle a config file', async (ctx) => {
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

			await ctx.parameter('resultModule', JSON.stringify(result.mod));
			await ctx.parameter('resultDependencies', JSON.stringify(result.dependencies));

			expect(result.mod).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.mod.default.loaded).toBe(true);
			// @ts-expect-error - Testing dynamic property
			expect(result.mod.default.bundled).toBe(true);
			expect(Array.isArray(result.dependencies)).toBe(true);
		});
	});

	test('Config Loader - loadConfigFile', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('loadConfigFile Tests');
		await allure.tags(...sharedTags);

		await allure.step('should return undefined when no config files exist', async (ctx) => {
			const result = await loadConfigFile(
				testDirUrl,
				['nonexistent1.config.js', 'nonexistent2.config.ts'],
				'missing-test'
			);

			await ctx.parameter('result', JSON.stringify(result));

			expect(result).toBeUndefined();
		});

		await allure.step('should load the first existing config file', async (ctx) => {
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

			await ctx.parameter('result', JSON.stringify(result));

			expect(result).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.order).toBe('first');
		});

		await allure.step('should throw error when config file has no default export', async (ctx) => {
			const configPath = join(testDir, 'no-default.config.js');
			const configContent = `
			export const namedExport = { value: 'named' };
			// No default export
		`;
			await writeFile(configPath, configContent, 'utf8');

			await ctx.parameter('configPath', configPath);
			await ctx.parameter('configContent', configContent);

			await expect(
				loadConfigFile(testDirUrl, ['no-default.config.js'], 'no-default-test')
			).rejects.toThrow(
				'Missing or invalid default export. Please export your config object as the default export.'
			);
		});

		await allure.step('should load TypeScript config file', async (ctx) => {
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

			await ctx.parameter('result', JSON.stringify(result));

			expect(result).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.name).toBe('typescript-test');
			// @ts-expect-error - Testing dynamic property
			expect(Array.isArray(result.features)).toBe(true);
			// @ts-expect-error - Testing dynamic property
			expect(result.features).toContain('typescript');
		});

		await allure.step('should load config file with complex exports', async (ctx) => {
			const configPath = join(testDir, 'complex-load.config.js');
			const configContent = `
			const baseConfig = {
				environment: 'production',
				database: {
					host: 'db.example.com',
					port: 3306
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

			const result = await loadConfigFile(
				testDirUrl,
				['complex-load.config.js'],
				'complex-load-test'
			);

			await ctx.parameter('result', JSON.stringify(result));

			expect(result).toBeTruthy();
			// @ts-expect-error - Testing dynamic property
			expect(result.environment).toBe('production');
			// @ts-expect-error - Testing dynamic property
			expect(result.database.host).toBe('db.example.com');
			// @ts-expect-error - Testing dynamic property
			expect(result.database.port).toBe(3306);
			// @ts-expect-error - Testing dynamic property
			expect(Array.isArray(result.features)).toBe(true);
			// @ts-expect-error - Testing dynamic property
			expect(result.features).toContain('feature1');
			// @ts-expect-error - Testing dynamic property
			expect(result.computed).toBe(2);
			// @ts-expect-error - Testing dynamic property
			expect(typeof result.timestamp).toBe('number');
		});
	});
});
