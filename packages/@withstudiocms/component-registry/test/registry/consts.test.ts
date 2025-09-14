import { describe, expect, it } from 'vitest';
import {
	buildAliasExports,
	buildVirtualImport,
	InternalId,
	RuntimeInternalId,
} from '../../src/registry/consts.js';
import type { ComponentRegistryEntry } from '../../src/types.js';

describe('buildVirtualImport', () => {
	it('should generate virtual import code with given keys, props, and components', () => {
		const componentKeys = ['Button', 'Input'];
		const componentProps: ComponentRegistryEntry[] = [
			{
				name: 'Button',
				safeName: 'button',
				props: [{ name: 'Button', type: 'string', optional: false }],
			},
			{
				name: 'Input',
				safeName: 'input',
				props: [{ name: 'Input', type: 'string', optional: false }],
			},
		];
		const components = ['export const Button = () => {};', 'export const Input = () => {};'];

		const result = buildVirtualImport(componentKeys, componentProps, components);

		expect(result).toContain(`export const componentKeys = ${JSON.stringify(componentKeys)};`);
		expect(result).toContain(`export const componentProps = ${JSON.stringify(componentProps)};`);
		expect(result).toContain('export const Button = () => {};');
		expect(result).toContain('export const Input = () => {};');
	});

	it('should handle empty arrays', () => {
		const result = buildVirtualImport([], [], []);
		expect(result).toContain('export const componentKeys = [];');
		expect(result).toContain('export const componentProps = [];');
		// Should not throw or add extra newlines
		expect(result.trim().endsWith('];')).toBe(true);
	});

	it('should handle undefined components array gracefully', () => {
		// @ts-expect-error testing undefined for components
		const result = buildVirtualImport(['A'], [{ key: 'A', props: {} }], undefined);
		expect(result).toContain('export const componentKeys = ["A"];');
		expect(result).toContain('export const componentProps = [{"key":"A","props":{}}];');
	});
});

describe('buildAliasExports', () => {
	it('should return correct export statements for a given virtualId', () => {
		const virtualId = 'my-module';
		const result = buildAliasExports(virtualId);

		expect(result).toHaveProperty(virtualId, `export * from '${InternalId}';`);
		expect(result).toHaveProperty(`${virtualId}/runtime`, `export * from '${RuntimeInternalId}';`);
	});

	it('should work with different virtualIds', () => {
		const virtualId = 'another-module';
		const result = buildAliasExports(virtualId);

		expect(result[virtualId]).toBe(`export * from '${InternalId}';`);
		expect(result[`${virtualId}/runtime`]).toBe(`export * from '${RuntimeInternalId}';`);
	});

	it('should not include extra keys', () => {
		const virtualId = 'test-module';
		const result = buildAliasExports(virtualId);

		expect(Object.keys(result)).toEqual([virtualId, `${virtualId}/runtime`]);
	});
});
