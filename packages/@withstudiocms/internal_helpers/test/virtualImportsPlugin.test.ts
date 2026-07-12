// @ts-nocheck
import { describe, expect, test } from 'vitest';
import { virtualImportsPlugin } from '../src/vite/virtualImportsPlugin.js';

describe('@withstudiocms/internal_helpers virtualImportsPlugin', () => {
	test('resolves and loads unscoped virtual imports', () => {
		const plugin = virtualImportsPlugin('test-plugin', {
			'test:virtual': 'export const value = 1;',
		}) as Exclude<ReturnType<typeof virtualImportsPlugin>, undefined>;

		const resolved = plugin.resolveId?.('test:virtual');
		expect(resolved).toBe('\0test:virtual');
		expect(plugin.load?.('\0test:virtual')).toBe('export const value = 1;');
	});

	test('only resolves and loads server-scoped imports in SSR context', () => {
		const plugin = virtualImportsPlugin('test-plugin', [
			{ id: 'test:server', content: 'export const target = "server";', context: 'server' },
		]) as Exclude<ReturnType<typeof virtualImportsPlugin>, undefined>;

		expect(plugin.resolveId?.('test:server', undefined, { ssr: true })).toBe('\0test:server');
		expect(plugin.resolveId?.('test:server', undefined, { ssr: false })).toBeUndefined();

		expect(plugin.load?.('\0test:server', { ssr: true })).toBe('export const target = "server";');
		expect(plugin.load?.('\0test:server', { ssr: false })).toBeUndefined();
	});

	test('only resolves and loads client-scoped imports in client context', () => {
		const plugin = virtualImportsPlugin('test-plugin', [
			{ id: 'test:client', content: 'export const target = "client";', context: 'client' },
		]) as Exclude<ReturnType<typeof virtualImportsPlugin>, undefined>;

		expect(plugin.resolveId?.('test:client', undefined, { ssr: false })).toBe('\0test:client');
		expect(plugin.resolveId?.('test:client', undefined, { ssr: true })).toBeUndefined();

		expect(plugin.load?.('\0test:client', { ssr: false })).toBe('export const target = "client";');
		expect(plugin.load?.('\0test:client', { ssr: true })).toBeUndefined();
	});
});
