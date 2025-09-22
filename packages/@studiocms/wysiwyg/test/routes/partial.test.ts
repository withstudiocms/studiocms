import { describe, expect, test, vi } from 'vitest';

// Mock the logger
vi.mock('studiocms:logger', () => ({
	apiResponseLogger: vi.fn(),
}));

describe('WYSIWYG Partial Route', () => {
	test('createRenderer function is available', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');

		expect(typeof createRenderer).toBe('function');
	});

	test('createRenderer returns identity function', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');

		const renderer = await createRenderer({} as any, {}, undefined);
		expect(typeof renderer).toBe('function');
		
		// Test that it returns content as-is (identity function)
		const testContent = '<p>Test content</p>';
		const result = await renderer(testContent);
		expect(result).toBe(testContent);
	});

	test('createRenderer handles different content types', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');

		const renderer = await createRenderer({} as any, {}, undefined);
		
		// Test with different content
		expect(await renderer('<div>HTML content</div>')).toBe('<div>HTML content</div>');
		expect(await renderer('Plain text')).toBe('Plain text');
		expect(await renderer('')).toBe('');
	});

	test('createRenderer handles undefined content', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');

		const renderer = await createRenderer({} as any, {}, undefined);
		
		// Test with undefined content - cast to string for type safety
		const result = await renderer(undefined as any);
		expect(result).toBe(undefined);
	});

	test('createRenderer handles null content', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');

		const renderer = await createRenderer({} as any, {}, undefined);
		
		// Test with null content - cast to string for type safety
		const result = await renderer(null as any);
		expect(result).toBe(null);
	});

	test('createRenderer is properly initialized', async () => {
		const { createRenderer } = await import('studiocms:component-registry/runtime');

		expect(createRenderer).toBeDefined();
		expect(typeof createRenderer).toBe('function');

		const renderer = await createRenderer({} as any, {}, undefined);
		expect(typeof renderer).toBe('function');
	});
});