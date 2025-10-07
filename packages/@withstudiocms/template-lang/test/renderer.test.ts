import { describe, expect, it } from 'vitest';
import { TemplateRenderer } from '../src/renderer';

describe('TemplateRenderer', () => {
	describe('Basic rendering', () => {
		it('should render simple variables', () => {
			const renderer = new TemplateRenderer();
			const result = renderer.render('Hello {{name}}!', { name: 'World' });
			expect(result).toBe('Hello World!');
		});

		it('should render nested properties', () => {
			const renderer = new TemplateRenderer();
			const result = renderer.render('{{user.name}}', { user: { name: 'John' } });
			expect(result).toBe('John');
		});

		it('should render deep nested properties', () => {
			const renderer = new TemplateRenderer();
			const data = { a: { b: { c: { d: 'deep' } } } };
			const result = renderer.render('{{a.b.c.d}}', data);
			expect(result).toBe('deep');
		});
	});

	describe('Missing variables', () => {
		it('should use empty string for missing variables by default', () => {
			const renderer = new TemplateRenderer();
			const result = renderer.render('Hello {{missing}}!', {});
			expect(result).toBe('Hello !');
		});

		it('should use custom default value', () => {
			const renderer = new TemplateRenderer({ defaultValue: '[MISSING]' });
			const result = renderer.render('Hello {{missing}}!', {});
			expect(result).toBe('Hello [MISSING]!');
		});

		it('should throw error in strict mode', () => {
			const renderer = new TemplateRenderer({ strict: true });
			expect(() => {
				renderer.render('Hello {{missing}}!', {});
			}).toThrow("Template variable 'missing' not found in data context");
		});
	});

	describe('Data types', () => {
		it('should convert numbers to strings', () => {
			const renderer = new TemplateRenderer();
			const result = renderer.render('Count: {{count}}', { count: 42 });
			expect(result).toBe('Count: 42');
		});

		it('should convert booleans to strings', () => {
			const renderer = new TemplateRenderer();
			const result = renderer.render('Active: {{active}}', { active: true });
			expect(result).toBe('Active: true');
		});

		it('should handle null values', () => {
			const renderer = new TemplateRenderer();
			const result = renderer.render('Value: {{value}}', { value: null });
			expect(result).toBe('Value: ');
		});

		it('should handle undefined values', () => {
			const renderer = new TemplateRenderer();
			const result = renderer.render('Value: {{value}}', { value: undefined });
			expect(result).toBe('Value: ');
		});
	});

	describe('Options management', () => {
		it('should allow updating options', () => {
			const renderer = new TemplateRenderer();

			// Default behavior
			let result = renderer.render('{{missing}}', {});
			expect(result).toBe('');

			// Update options
			renderer.setOptions({ defaultValue: 'DEFAULT' });
			result = renderer.render('{{missing}}', {});
			expect(result).toBe('DEFAULT');
		});

		it('should merge options when updating', () => {
			const renderer = new TemplateRenderer({ strict: false, defaultValue: 'OLD' });

			// Update only defaultValue, keep strict setting
			renderer.setOptions({ defaultValue: 'NEW' });

			const result = renderer.render('{{missing}}', {});
			expect(result).toBe('NEW'); // New default value

			// Should still not be strict (no error thrown)
			expect(() => renderer.render('{{missing}}', {})).not.toThrow();
		});
	});
});
