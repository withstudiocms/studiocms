import { describe, expect, test } from 'vitest';
import { firstUpperCase, parse } from '../../src/lib/utils';

describe('Utils', () => {
	describe('firstUpperCase', () => {
		test('converts first character to uppercase', () => {
			expect(firstUpperCase('hello')).toBe('Hello');
			expect(firstUpperCase('world')).toBe('World');
			expect(firstUpperCase('test')).toBe('Test');
		});

		test('handles single character strings', () => {
			expect(firstUpperCase('a')).toBe('A');
			expect(firstUpperCase('z')).toBe('Z');
		});

		test('handles empty string', () => {
			expect(firstUpperCase('')).toBe('');
		});

		test('handles strings with numbers', () => {
			expect(firstUpperCase('123abc')).toBe('123abc');
			expect(firstUpperCase('abc123')).toBe('Abc123');
		});

		test('handles strings with special characters', () => {
			expect(firstUpperCase('!hello')).toBe('!hello');
			expect(firstUpperCase('@world')).toBe('@world');
			expect(firstUpperCase('hello world')).toBe('Hello world');
		});

		test('handles already uppercase first character', () => {
			expect(firstUpperCase('Hello')).toBe('Hello');
			expect(firstUpperCase('WORLD')).toBe('WORLD');
		});

		test('handles mixed case strings', () => {
			expect(firstUpperCase('hELLO')).toBe('HELLO');
			expect(firstUpperCase('wOrLd')).toBe('WOrLd');
		});

		test('handles unicode characters', () => {
			expect(firstUpperCase('ñandú')).toBe('Ñandú');
			expect(firstUpperCase('αβγ')).toBe('Αβγ');
		});
	});

	describe('parse', () => {
		test('parses valid JSON strings', () => {
			const jsonString = '{"name": "John", "age": 30}';
			const result = parse<{ name: string; age: number }>(jsonString);

			expect(result).toEqual({ name: 'John', age: 30 });
			expect(result.name).toBe('John');
			expect(result.age).toBe(30);
		});

		test('parses arrays', () => {
			const jsonString = '[1, 2, 3, "test"]';
			const result = parse<(number | string)[]>(jsonString);

			expect(result).toEqual([1, 2, 3, 'test']);
		});

		test('parses nested objects', () => {
			const jsonString = '{"user": {"name": "John", "address": {"city": "NYC"}}}';
			const result = parse<{ user: { name: string; address: { city: string } } }>(jsonString);

			expect(result.user.name).toBe('John');
			expect(result.user.address.city).toBe('NYC');
		});

		test('parses primitive values', () => {
			expect(parse<string>('"hello"')).toBe('hello');
			expect(parse<number>('42')).toBe(42);
			expect(parse<boolean>('true')).toBe(true);
			expect(parse<null>('null')).toBe(null);
		});

		test('throws SyntaxError for invalid JSON', () => {
			expect(() => parse('invalid json')).toThrow(SyntaxError);
			expect(() => parse('{name: "John"}')).toThrow(SyntaxError);
			expect(() => parse('[1, 2, 3, ]')).toThrow(SyntaxError);
			expect(() => parse('{"name": "John",}')).toThrow(SyntaxError);
		});

		test('throws SyntaxError for empty string', () => {
			expect(() => parse('')).toThrow(SyntaxError);
		});

		test('throws SyntaxError for malformed JSON', () => {
			expect(() => parse('{"name": "John"')).toThrow(SyntaxError);
			expect(() => parse('{"name": "John", "age":}')).toThrow(SyntaxError);
		});

		test('handles complex JSON structures', () => {
			const complexJson = JSON.stringify({
				users: [
					{ id: 1, name: 'John', active: true },
					{ id: 2, name: 'Jane', active: false },
				],
				metadata: {
					total: 2,
					page: 1,
					hasMore: false,
				},
			});

			const result = parse<{
				users: Array<{ id: number; name: string; active: boolean }>;
				metadata: { total: number; page: number; hasMore: boolean };
			}>(complexJson);

			expect(result.users).toHaveLength(2);
			expect(result.users[0].name).toBe('John');
			expect(result.users[1].name).toBe('Jane');
			expect(result.metadata.total).toBe(2);
		});

		test('preserves type information through generic parameter', () => {
			const jsonString = '{"id": 1, "name": "test"}';
			const result = parse<{ id: number; name: string }>(jsonString);

			// TypeScript should infer the correct types
			expect(typeof result.id).toBe('number');
			expect(typeof result.name).toBe('string');
		});
	});
});
