import { describe, expect, it, vi } from 'vitest';
import * as utils from '../../src/virtuals/utils';

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

describe('buildDefaultOnlyVirtual', () => {
	it('should export the object as default', () => {
		const obj = { foo: 'bar' };
		const result = utils.buildDefaultOnlyVirtual(obj);
		expect(result).toBe('export default {"foo":"bar"};');
	});
});

describe('buildNamedMultiExportVirtual', () => {
	it('should export multiple named constants', () => {
		const items = { foo: 'bar', baz: 'qux' };
		const result = utils.buildNamedMultiExportVirtual(items);
		expect(result).toContain('export const foo = "bar";');
		expect(result).toContain('export const baz = "qux";');
	});
});

describe('buildVirtualConfig', () => {
	it('should inject options into config stub', () => {
		const options = { site: 'https://example.com', plugins: [] };
		// biome-ignore lint/suspicious/noExplicitAny: allowed for tests
		const result = utils.buildVirtualConfig(options as any);
		expect(result).toBe('export default {"site":"https://example.com","plugins":[]};');
	});
});

describe('buildLoggerVirtual', () => {
	it('should inject verbose flag into logger stub', () => {
		const result = utils.buildLoggerVirtual(true);
		expect(result).toBe('const verbose = true;');
	});
});

describe('VirtualModuleBuilder', () => {
	const resolve = (...segments: string[]) => segments.join('/');
	const builder = utils.VirtualModuleBuilder(resolve);

	it('dynamicVirtual exports all modules', () => {
		const items = ['foo.js', 'bar.js'];
		const result = builder.dynamicVirtual(items);
		expect(result).toContain('export * from "foo.js";');
		expect(result).toContain('export * from "bar.js";');
	});

	it('ambientScripts imports all modules', () => {
		const items = ['foo.js', 'bar.js'];
		const result = builder.ambientScripts(items);
		expect(result).toContain("import 'foo.js';");
		expect(result).toContain("import 'bar.js';");
	});

	it('namedVirtual re-exports named export', () => {
		const result = builder.namedVirtual({
			namedExport: 'myExport',
			path: 'mod.js',
			exportDefault: true,
		});
		expect(result).toContain('import { myExport } from "mod.js";');
		expect(result).toContain('export { myExport };');
		expect(result).toContain('export default myExport;');
	});

	it('astroComponentVirtual exports components with custom names', () => {
		const items = { Foo: 'foo.astro', Bar: 'bar.astro' };
		const result = builder.astroComponentVirtual(items);
		expect(result).toContain('export { default as Foo } from "foo.astro"');
		expect(result).toContain('export { default as Bar } from "bar.astro"');
	});

	it('dynamicWithAstroVirtual combines dynamic and astro exports', () => {
		const dynamicExports = ['foo.js'];
		const astroComponents = { Bar: 'bar.astro' };
		const result = builder.dynamicWithAstroVirtual({ dynamicExports, astroComponents });
		expect(result).toContain('export * from "foo.js";');
		expect(result).toContain('export { default as Bar } from "bar.astro"');
	});
});
