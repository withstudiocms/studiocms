import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { convertToSafeString } from '../../dist/utils/safeString.js';

describe('utils/safeString', () => {
	test('convertToSafeString replaces non-alphanumeric with underscores', () => {
		assert.equal(convertToSafeString('Hello, World!'), 'hello__world');
		assert.equal(convertToSafeString('foo@bar.com'), 'foo_bar_com');
		assert.equal(convertToSafeString('foo-bar_baz'), 'foo_bar_baz');
		assert.equal(convertToSafeString('foo bar'), 'foo_bar');
	});

	test('convertToSafeString trims leading and trailing underscores', () => {
		assert.equal(convertToSafeString('__foo__'), 'foo');
		assert.equal(convertToSafeString('___foo_bar___'), 'foo_bar');
		assert.equal(convertToSafeString('___'), '');
	});

	test('convertToSafeString lowercases the result', () => {
		assert.equal(convertToSafeString('FOO_BAR'), 'foo_bar');
		assert.equal(convertToSafeString('CamelCase123'), 'camelcase123');
	});

	test('convertToSafeString returns empty string for empty input', () => {
		assert.equal(convertToSafeString(''), '');
	});

	test('convertToSafeString handles only special characters', () => {
		assert.equal(convertToSafeString('!@#$%^&*()'), '');
	});
});
