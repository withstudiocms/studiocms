import { describe, expect, vi } from 'vitest';
import * as utils from '../../src/virtuals/utils';
import { allureTester } from '../fixtures/allureTester';
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
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	test('buildDefaultOnlyVirtual - should export the object as default', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'buildDefaultOnlyVirtual test',
			tags: [...sharedTags, 'utils:virtuals', 'function:buildDefaultOnlyVirtual'],
		});

		await step('Testing buildDefaultOnlyVirtual function', async () => {
			const obj = { foo: 'bar' };
			const result = utils.buildDefaultOnlyVirtual(obj);
			expect(result).toBe('export default {"foo":"bar"};');
		});
	});

	test('buildNamedMultiExportVirtual - should export multiple named constants', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'buildNamedMultiExportVirtual test',
			tags: [...sharedTags, 'utils:virtuals', 'function:buildNamedMultiExportVirtual'],
		});

		await step('Testing buildNamedMultiExportVirtual function', async () => {
			const items = { foo: 'bar', baz: 'qux' };
			const result = utils.buildNamedMultiExportVirtual(items);
			expect(result).toContain('export const foo = "bar";');
			expect(result).toContain('export const baz = "qux";');
		});
	});

	test('buildVirtualConfig - should inject options into config stub', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'buildVirtualConfig test',
			tags: [...sharedTags, 'utils:virtuals', 'function:buildVirtualConfig'],
		});

		await step('Testing buildVirtualConfig function', async () => {
			const options = { site: 'https://example.com', plugins: [] };
			const result = utils.buildVirtualConfig(options as any);
			expect(result).toBe('export default {"site":"https://example.com","plugins":[]};');
		});
	});

	test('buildLoggerVirtual - should inject verbose flag into logger stub', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'buildLoggerVirtual test',
			tags: [...sharedTags, 'utils:virtuals', 'function:buildLoggerVirtual'],
		});

		await step('Testing buildLoggerVirtual function', async () => {
			const result = utils.buildLoggerVirtual(true);
			expect(result).toBe('const verbose = true;');
		});
	});

	//
	// Tests for VirtualModuleBuilder class
	//

	const resolve = (...segments: string[]) => segments.join('/');
	const builder = utils.VirtualModuleBuilder(resolve);

	test('VirtualModuleBuilder - dynamicVirtual exports all modules', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'VirtualModuleBuilder - dynamicVirtual test',
			tags: [
				...sharedTags,
				'utils:virtuals',
				'class:VirtualModuleBuilder',
				'method:dynamicVirtual',
			],
		});

		await step('Testing dynamicVirtual method', async () => {
			const items = ['foo.js', 'bar.js'];
			const result = builder.dynamicVirtual(items);
			expect(result).toContain('export * from "foo.js";');
		});
	});

	test('VirtualModuleBuilder - ambientScripts imports all modules', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'VirtualModuleBuilder - ambientScripts test',
			tags: [
				...sharedTags,
				'utils:virtuals',
				'class:VirtualModuleBuilder',
				'method:ambientScripts',
			],
		});

		await step('Testing ambientScripts method', async () => {
			const items = ['foo.js', 'bar.js'];
			const result = builder.ambientScripts(items);
			expect(result).toContain("import 'foo.js';");
			expect(result).toContain("import 'bar.js';");
		});
	});

	test('VirtualModuleBuilder - namedVirtual re-exports named export', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'VirtualModuleBuilder - namedVirtual test',
			tags: [...sharedTags, 'utils:virtuals', 'class:VirtualModuleBuilder', 'method:namedVirtual'],
		});

		await step('Testing namedVirtual method', async () => {
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

	test('VirtualModuleBuilder - astroComponentVirtual exports components with custom names', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'VirtualModuleBuilder - astroComponentVirtual test',
			tags: [
				...sharedTags,
				'utils:virtuals',
				'class:VirtualModuleBuilder',
				'method:astroComponentVirtual',
			],
		});

		await step('Testing astroComponentVirtual method', async () => {
			const items = { Foo: 'foo.astro', Bar: 'bar.astro' };
			const result = builder.astroComponentVirtual(items);
			expect(result).toContain('export { default as Foo } from "foo.astro"');
			expect(result).toContain('export { default as Bar } from "bar.astro"');
		});
	});

	test('VirtualModuleBuilder - dynamicWithAstroVirtual combines dynamic and astro exports', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'VirtualModuleBuilder - dynamicWithAstroVirtual test',
			tags: [
				...sharedTags,
				'utils:virtuals',
				'class:VirtualModuleBuilder',
				'method:dynamicWithAstroVirtual',
			],
		});

		await step('Testing dynamicWithAstroVirtual method', async () => {
			const dynamicExports = ['foo.js'];
			const astroComponents = { Bar: 'bar.astro' };
			const result = builder.dynamicWithAstroVirtual({ dynamicExports, astroComponents });
			expect(result).toContain('export * from "foo.js";');
			expect(result).toContain('export { default as Bar } from "bar.astro"');
		});
	});
});
