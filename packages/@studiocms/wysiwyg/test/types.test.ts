import { describe, expect, test } from 'vitest';
import { WYSIWYGSchema, type WYSIWYGSchemaOptions } from '../src/types';

describe('WYSIWYG Types and Schema', () => {
	describe('WYSIWYGSchema', () => {
		test('validates empty object as default', () => {
			const result = WYSIWYGSchema.parse({});
			expect(result).toEqual({});
		});

		test('validates undefined as default', () => {
			const result = WYSIWYGSchema.parse(undefined);
			expect(result).toEqual({});
		});

		test('validates null as default', () => {
			// null should be converted to default value
			expect(() => WYSIWYGSchema.parse(null)).toThrow();
		});

		test('validates sanitize options', () => {
			const options = {
				sanitize: {
					allowElements: ['div', 'h1', 'p'],
					allowAttributes: {
						'*': ['class'],
						a: ['href'],
					},
				},
			};

			const result = WYSIWYGSchema.parse(options);
			expect(result).toEqual(options);
		});

		test('validates minimal sanitize options', () => {
			const options = {
				sanitize: {},
			};

			const result = WYSIWYGSchema.parse(options);
			expect(result).toEqual(options);
		});

		test('validates sanitize with allowElements only', () => {
			const options = {
				sanitize: {
					allowElements: ['div', 'span', 'p'],
				},
			};

			const result = WYSIWYGSchema.parse(options);
			expect(result).toEqual(options);
		});

		test('validates sanitize with allowAttributes only', () => {
			const options = {
				sanitize: {
					allowAttributes: {
						'*': ['class', 'id'],
						img: ['src', 'alt'],
					},
				},
			};

			const result = WYSIWYGSchema.parse(options);
			expect(result).toEqual(options);
		});

		test('validates sanitize with blockElements only', () => {
			const options = {
				sanitize: {
					blockElements: ['script', 'style'],
				},
			};

			const result = WYSIWYGSchema.parse(options);
			expect(result).toEqual(options);
		});

		test('validates complex sanitize options', () => {
			const options = {
				sanitize: {
					allowElements: [
						'div',
						'h1',
						'h2',
						'h3',
						'p',
						'strong',
						'em',
						'a',
						'ul',
						'li',
						'pre',
						'code',
					],
					allowAttributes: {
						'*': ['class', 'id'],
						a: ['href', 'target', 'rel'],
						img: ['src', 'alt', 'width', 'height'],
						pre: ['class'],
						code: ['class'],
					},
					blockElements: ['script', 'style'],
					allowComponents: true,
					allowCustomElements: false,
					allowComments: false,
				},
			};

			const result = WYSIWYGSchema.parse(options);
			expect(result).toEqual(options);
		});

		test('throws error for invalid sanitize options', () => {
			const invalidOptions = {
				sanitize: {
					allowElements: 'should be array', // Invalid type
				},
			};

			expect(() => WYSIWYGSchema.parse(invalidOptions)).toThrow();
		});

		test('throws error for invalid allowElements type', () => {
			const invalidOptions = {
				sanitize: {
					allowElements: 'not-an-array',
				},
			};

			expect(() => WYSIWYGSchema.parse(invalidOptions)).toThrow();
		});

		test('throws error for invalid allowAttributes type', () => {
			const invalidOptions = {
				sanitize: {
					allowAttributes: 'not-an-object',
				},
			};

			expect(() => WYSIWYGSchema.parse(invalidOptions)).toThrow();
		});

		test('throws error for invalid blockElements type', () => {
			const invalidOptions = {
				sanitize: {
					blockElements: 'not-an-array',
				},
			};

			expect(() => WYSIWYGSchema.parse(invalidOptions)).toThrow();
		});

		test('throws error for non-object input', () => {
			expect(() => WYSIWYGSchema.parse('string')).toThrow();
			expect(() => WYSIWYGSchema.parse(123)).toThrow();
			expect(() => WYSIWYGSchema.parse(true)).toThrow();
			expect(() => WYSIWYGSchema.parse([])).toThrow();
		});

		test('handles extra properties gracefully', () => {
			const options = {
				sanitize: {
					allowElements: ['div', 'p'],
				},
				extraProperty: 'should be ignored',
			};

			const result = WYSIWYGSchema.parse(options);
			expect(result).toEqual({
				sanitize: {
					allowElements: ['div', 'p'],
				},
			});
		});
	});

	describe('WYSIWYGSchemaOptions type', () => {
		test('type inference works correctly', () => {
			const options: WYSIWYGSchemaOptions = {
				sanitize: {
					allowedTags: ['div', 'p'],
					allowedAttributes: {
						'*': ['class'],
					},
				},
			};

			expect(options.sanitize?.allowedTags).toEqual(['div', 'p']);
			expect(options.sanitize?.allowedAttributes).toEqual({
				'*': ['class'],
			});
		});

		test('type allows undefined', () => {
			const options: WYSIWYGSchemaOptions = undefined;
			expect(options).toBeUndefined();
		});

		test('type allows empty object', () => {
			const options: WYSIWYGSchemaOptions = {};
			expect(options).toEqual({});
		});
	});

	describe('Schema edge cases', () => {
		test('handles empty arrays in sanitize options', () => {
			const options = {
				sanitize: {
					allowElements: [],
					allowAttributes: {},
					blockElements: [],
				},
			};

			const result = WYSIWYGSchema.parse(options);
			expect(result).toEqual(options);
		});

		test('handles nested allowAttributes', () => {
			const options = {
				sanitize: {
					allowAttributes: {
						'*': ['class', 'id'],
						a: ['href', 'target'],
						img: ['src', 'alt', 'width', 'height'],
						div: ['class', 'id', 'data-*'],
					},
				},
			};

			const result = WYSIWYGSchema.parse(options);
			expect(result).toEqual(options);
		});

		test('handles allowComponents if supported', () => {
			const options = {
				sanitize: {
					allowComponents: true,
					allowCustomElements: false,
					allowComments: false,
				},
			};

			const result = WYSIWYGSchema.parse(options);
			expect(result).toEqual(options);
		});
	});
});
