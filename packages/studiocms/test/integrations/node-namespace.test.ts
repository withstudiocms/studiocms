import type { AstroIntegration } from 'astro';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { nodeNamespaceBuiltinsAstro, resolveBuiltIns } from '../../src/integrations/node-namespace';

describe('nodeNamespaceBuiltinsAstro', () => {
	it('should return an AstroIntegration object with correct name', () => {
		const integration = nodeNamespaceBuiltinsAstro();
		expect(integration).toBeDefined();
		expect(integration.name).toBe('vite-namespace-builtins');
		expect(typeof integration.hooks['astro:config:setup']).toBe('function');
		expectTypeOf(integration).toEqualTypeOf<AstroIntegration>();
	});

	describe('resolveBuiltIns', () => {
		it('should return undefined for relative paths', () => {
			expect(resolveBuiltIns('./fs')).toBeUndefined();
			expect(resolveBuiltIns('../path')).toBeUndefined();
			expect(resolveBuiltIns('/fs')).toBeUndefined();
		});

		it('should return undefined for empty or falsy id', () => {
			expect(resolveBuiltIns('')).toBeUndefined();
			expect(resolveBuiltIns(undefined as any)).toBeUndefined();
			expect(resolveBuiltIns(null as any)).toBeUndefined();
		});

		it('should resolve plain built-in modules', () => {
			const result = resolveBuiltIns('fs');
			expect(result).toEqual({ id: 'node:fs', external: true });
		});

		it('should resolve namespaced built-in modules', () => {
			const result = resolveBuiltIns('node:path');
			expect(result).toEqual({ id: 'node:path', external: true });
		});

		it('should resolve built-in subpaths', () => {
			const result = resolveBuiltIns('fs/promises');
			expect(result).toEqual({ id: 'node:fs/promises', external: true });
		});

		it('should resolve namespaced built-in subpaths', () => {
			const result = resolveBuiltIns('node:fs/promises');
			expect(result).toEqual({ id: 'node:fs/promises', external: true });
		});

		it('should return undefined for non-built-in modules', () => {
			expect(resolveBuiltIns('some-nonexistent-module')).toBeUndefined();
			expect(resolveBuiltIns('astro')).toBeUndefined();
		});
	});
});
