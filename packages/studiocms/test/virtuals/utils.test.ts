import * as allure from 'allure-js-commons';
import { describe, expect, test, vi } from 'vitest';
import * as utils from '../../src/virtuals/utils';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Virtual Module Utils tests';

// Mock fs and createResolver for file-based functions
vi.mock('node:fs', () => ({
	default: {
		readFileSync: vi.fn((path: string, _encoding: string) => {
			if (path.endsWith('config.stub.js')) return 'export default $$options$$;';
			if (path.endsWith('logger.stub.js')) return 'const verbose = $$verbose$$;';
			return '';
		}),
	},
}));

vi.mock('astro-integration-kit', () => ({
	createResolver: () => ({
		resolve: (...segments: string[]) => segments.join('/'),
	}),
}));

describe(parentSuiteName, () => {
	test('buildDefaultOnlyVirtual - should export the object as default', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildDefaultOnlyVirtual test');
		const tags = [...sharedTags, 'utils:virtuals', 'function:buildDefaultOnlyVirtual'];
		await allure.tags(...tags);

		await allure.step('Testing buildDefaultOnlyVirtual function', async () => {
			const obj = { foo: 'bar' };
			const result = utils.buildDefaultOnlyVirtual(obj);
			expect(result).toBe('export default {"foo":"bar"};');
		});
	});

	test('buildNamedMultiExportVirtual - should export multiple named constants', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildNamedMultiExportVirtual test');
		const tags = [...sharedTags, 'utils:virtuals', 'function:buildNamedMultiExportVirtual'];
		await allure.tags(...tags);

		await allure.step('Testing buildNamedMultiExportVirtual function', async () => {
			const items = { foo: 'bar', baz: 'qux' };
			const result = utils.buildNamedMultiExportVirtual(items);
			expect(result).toContain('export const foo = "bar";');
			expect(result).toContain('export const baz = "qux";');
		});
	});

	test('buildVirtualConfig - should inject options into config stub', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildVirtualConfig test');
		const tags = [...sharedTags, 'utils:virtuals', 'function:buildVirtualConfig'];
		await allure.tags(...tags);

		await allure.step('Testing buildVirtualConfig function', async () => {
			const options = { site: 'https://example.com', plugins: [] };
			const result = utils.buildVirtualConfig(options as any);
			expect(result).toBe('export default {"site":"https://example.com","plugins":[]};');
		});
	});

	test('buildLoggerVirtual - should inject verbose flag into logger stub', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('buildLoggerVirtual test');
		const tags = [...sharedTags, 'utils:virtuals', 'function:buildLoggerVirtual'];
		await allure.tags(...tags);

		await allure.step('Testing buildLoggerVirtual function', async () => {
			const result = utils.buildLoggerVirtual(true);
			expect(result).toBe('const verbose = true;');
		});
	});

	//
	// Tests for VirtualModuleBuilder class
	//

	const resolve = (...segments: string[]) => segments.join('/');
	const builder = utils.VirtualModuleBuilder(resolve);

	test('VirtualModuleBuilder - dynamicVirtual exports all modules', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('VirtualModuleBuilder - dynamicVirtual test');
		const tags = [
			...sharedTags,
			'utils:virtuals',
			'class:VirtualModuleBuilder',
			'method:dynamicVirtual',
		];
		await allure.tags(...tags);

		await allure.step('Testing dynamicVirtual method', async () => {
			const items = ['foo.js', 'bar.js'];
			const result = builder.dynamicVirtual(items);
			expect(result).toContain('export * from "foo.js";');
			expect(result).toContain('export * from "bar.js";');
		});
	});

	test('VirtualModuleBuilder - ambientScripts imports all modules', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('VirtualModuleBuilder - ambientScripts test');
		const tags = [
			...sharedTags,
			'utils:virtuals',
			'class:VirtualModuleBuilder',
			'method:ambientScripts',
		];
		await allure.tags(...tags);

		await allure.step('Testing ambientScripts method', async () => {
			const items = ['foo.js', 'bar.js'];
			const result = builder.ambientScripts(items);
			expect(result).toContain("import 'foo.js';");
			expect(result).toContain("import 'bar.js';");
		});
	});

	test('VirtualModuleBuilder - namedVirtual re-exports named export', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('VirtualModuleBuilder - namedVirtual test');
		const tags = [
			...sharedTags,
			'utils:virtuals',
			'class:VirtualModuleBuilder',
			'method:namedVirtual',
		];
		await allure.tags(...tags);

		await allure.step('Testing namedVirtual method', async () => {
			const result = builder.namedVirtual({
				namedExport: 'myExport',
				path: 'mod.js',
				exportDefault: true,
			});
			expect(result).toContain('import { myExport } from "mod.js";');
			expect(result).toContain('export { myExport };');
			expect(result).toContain('export default myExport;');
		});
	});

	test('VirtualModuleBuilder - astroComponentVirtual exports components with custom names', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('VirtualModuleBuilder - astroComponentVirtual test');
		const tags = [
			...sharedTags,
			'utils:virtuals',
			'class:VirtualModuleBuilder',
			'method:astroComponentVirtual',
		];
		await allure.tags(...tags);

		await allure.step('Testing astroComponentVirtual method', async () => {
			const items = { Foo: 'foo.astro', Bar: 'bar.astro' };
			const result = builder.astroComponentVirtual(items);
			expect(result).toContain('export { default as Foo } from "foo.astro"');
			expect(result).toContain('export { default as Bar } from "bar.astro"');
		});
	});

	test('VirtualModuleBuilder - dynamicWithAstroVirtual combines dynamic and astro exports', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('VirtualModuleBuilder - dynamicWithAstroVirtual test');
		const tags = [
			...sharedTags,
			'utils:virtuals',
			'class:VirtualModuleBuilder',
			'method:dynamicWithAstroVirtual',
		];
		await allure.tags(...tags);

		await allure.step('Testing dynamicWithAstroVirtual method', async () => {
			const dynamicExports = ['foo.js'];
			const astroComponents = { Bar: 'bar.astro' };
			const result = builder.dynamicWithAstroVirtual({ dynamicExports, astroComponents });
			expect(result).toContain('export * from "foo.js";');
			expect(result).toContain('export { default as Bar } from "bar.astro"');
		});
	});
});
