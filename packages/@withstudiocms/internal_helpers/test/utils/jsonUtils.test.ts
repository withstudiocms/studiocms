import { describe, expect, it } from 'vitest';
import { jsonParse, readJson } from '../../src/utils/jsonUtils.js';

describe('jsonParse', () => {
	it('parses valid JSON string to object', () => {
		const json = '{"foo":"bar","baz":42}';
		const result = jsonParse<{ foo: string; baz: number }>(json);
		expect(result).toEqual({ foo: 'bar', baz: 42 });
	});

	it('throws SyntaxError on invalid JSON', () => {
		const invalidJson = '{"foo":}';
		expect(() => jsonParse(invalidJson)).toThrow(SyntaxError);
	});
});

describe('readJson', () => {
	const mockPath = '/fake/path/config.json';
	const mockJson = '{"hello":"world","num":123}';

	it('reads and parses JSON file content', () => {
		const mockReadFileSync = (path: string, encoding: BufferEncoding) => {
			expect(path).toBe(mockPath);
			expect(encoding).toBe('utf-8');
			return mockJson;
		};
		const result = readJson<{ hello: string; num: number }>(mockPath, mockReadFileSync);
		expect(result).toEqual({ hello: 'world', num: 123 });
	});

	it('throws SyntaxError if file content is invalid JSON', () => {
		const mockReadFileSync = () => '{invalid}';
		expect(() => readJson(mockPath, mockReadFileSync)).toThrow(SyntaxError);
	});
});
