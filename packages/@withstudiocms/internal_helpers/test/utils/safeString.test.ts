import { describe, expect, it } from 'vitest';
import { convertToSafeString } from '../../src/utils/safeString.js';

describe('utils/safeString', () => {
	it('convertToSafeString replaces non-alphanumeric with underscores', () => {
		expect(convertToSafeString('Hello, World!')).toBe('hello__world');
		expect(convertToSafeString('foo@bar.com')).toBe('foo_bar_com');
		expect(convertToSafeString('foo-bar_baz')).toBe('foo_bar_baz');
		expect(convertToSafeString('foo bar')).toBe('foo_bar');
	});

	it('convertToSafeString trims leading and trailing underscores', () => {
		expect(convertToSafeString('__foo__')).toBe('foo');
		expect(convertToSafeString('___foo_bar___')).toBe('foo_bar');
		expect(convertToSafeString('___')).toBe('');
	});

	it('convertToSafeString lowercases the result', () => {
		expect(convertToSafeString('FOO_BAR')).toBe('foo_bar');
		expect(convertToSafeString('CamelCase123')).toBe('camelcase123');
	});

	it('convertToSafeString returns empty string for empty input', () => {
		expect(convertToSafeString('')).toBe('');
	});

	it('convertToSafeString handles only special characters', () => {
		expect(convertToSafeString('!@#$%^&*()')).toBe('');
	});
});
