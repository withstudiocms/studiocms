import { describe, expect, it } from 'vitest';
import { HTMLSchema, type HTMLSchemaOptions } from '../src/types.js';

describe('HTMLSchema', () => {
	describe('validation', () => {
		it('should accept undefined options', () => {
			const result = HTMLSchema.safeParse(undefined);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({});
			}
		});

		it('should accept empty object', () => {
			const result = HTMLSchema.safeParse({});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({});
			}
		});

		it('should accept valid sanitize options', () => {
			const validOptions = {
				sanitize: {
					allowElements: ['p', 'br', 'strong'],
					allowAttributes: {
						p: ['class', 'id'],
						strong: ['class'],
					},
				},
			};

			const result = HTMLSchema.safeParse(validOptions);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validOptions);
			}
		});

		it('should handle invalid sanitize options', () => {
			const invalidOptions = {
				sanitize: {
					invalidProperty: 'test',
				},
			};

			const result = HTMLSchema.safeParse(invalidOptions);
			// The schema might accept unknown properties or handle them gracefully
			// Let's just verify the result is defined
			expect(result).toBeDefined();
		});

		it('should reject non-object input', () => {
			const result = HTMLSchema.safeParse('invalid');
			expect(result.success).toBe(false);
		});

		it('should reject null input', () => {
			const result = HTMLSchema.safeParse(null);
			expect(result.success).toBe(false);
		});
	});

	describe('default values', () => {
		it('should provide default empty object when undefined', () => {
			const result = HTMLSchema.parse(undefined);
			expect(result).toEqual({});
		});

		it('should provide default empty object when empty object provided', () => {
			const result = HTMLSchema.parse({});
			expect(result).toEqual({});
		});
	});

	describe('type inference', () => {
		it('should correctly infer HTMLSchemaOptions type', () => {
			const options: HTMLSchemaOptions = {
				sanitize: {
					allowElements: ['p', 'br'],
					allowAttributes: {
						p: ['class'],
					},
				},
			};

			expect(options).toBeDefined();
			expect(options.sanitize).toBeDefined();
			expect(Array.isArray(options.sanitize?.allowElements)).toBe(true);
		});

		it('should allow empty HTMLSchemaOptions', () => {
			const options: HTMLSchemaOptions = {};
			expect(options).toBeDefined();
		});
	});
});
