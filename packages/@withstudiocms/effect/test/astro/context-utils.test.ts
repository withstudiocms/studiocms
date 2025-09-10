import { describe, expect, it } from 'vitest';
import {
	parseAPIContextFormDataToObject,
	parseAPIContextJson,
	parseFormDataEntryToString,
	readAPIContextFormData,
	readAPIContextJson,
} from '../../src/astro/context-utils.js';
import { Effect, Schema } from '../../src/effect.js';

// Mocks
type MockedJson = { foo: string };
const mockJson = { foo: 'bar' };
const mockFormData = new FormData();
mockFormData.append('foo', 'bar');
mockFormData.append('file', new Blob(['content'], { type: 'text/plain' }));

const mockRequestJson = {
	json: async () => mockJson,
	formData: async () => mockFormData,
};

const mockAPIContext = { request: mockRequestJson };

// Dummy Schema
const dummySchema = Schema.Struct({
	foo: Schema.String,
	file: Schema.optional(Schema.Unknown),
});

describe('API Context Utils', () => {
	it('readAPIContextJson: should parse JSON from request', async () => {
		// @ts-expect-error - Testing with partial mock
		const effect = readAPIContextJson<MockedJson>(mockAPIContext);
		const result = await Effect.runPromise(effect);
		expect(result).toEqual(mockJson);
	});

	it('readAPIContextJson: should fail if request.json throws', async () => {
		const badContext = {
			request: {
				json: async () => {
					throw new Error('bad');
				},
			},
		};
		// @ts-expect-error - Testing with partial mock
		const effect = readAPIContextJson<object>(badContext);
		await expect(Effect.runPromise(effect)).rejects.toThrow(/Failed to parse JSON from Request/);
	});

	it('parseAPIContextJson: should parse and decode JSON with schema', async () => {
		// @ts-expect-error - Testing with partial mock
		const effect = parseAPIContextJson(mockAPIContext, dummySchema);
		const result = await Effect.runPromise(effect);
		expect(result).toEqual(mockJson);
	});

	it('parseAPIContextJson: should parse JSON without schema', async () => {
		// @ts-expect-error - Testing with partial mock
		const effect = parseAPIContextJson<MockedJson>(mockAPIContext);
		const result = await Effect.runPromise(effect as Effect.Effect<MockedJson, Error, never>);
		expect(result).toEqual(mockJson);
	});

	it('parseAPIContextJson: should fail if JSON parsing fails', async () => {
		const badContext = {
			request: {
				json: async () => {
					throw new Error('bad');
				},
			},
		};
		// @ts-expect-error - Testing with partial mock
		const effect = parseAPIContextJson<object>(badContext);
		await expect(Effect.runPromise(effect as Effect.Effect<object, Error, never>)).rejects.toThrow(
			/Failed to read JSON/
		);
	});

	it('readAPIContextFormData: should parse FormData from request', async () => {
		// @ts-expect-error - Testing with partial mock
		const effect = readAPIContextFormData(mockAPIContext);
		const result = await Effect.runPromise(effect);
		expect(result.get('foo')).toBe('bar');
	});

	it('readAPIContextFormData: should fail if request.formData throws', async () => {
		const badContext = {
			request: {
				formData: async () => {
					throw new Error('bad');
				},
			},
		};
		// @ts-expect-error - Testing with partial mock
		const effect = readAPIContextFormData(badContext);
		await expect(Effect.runPromise(effect)).rejects.toThrow(
			/Failed to parse formData from Request/
		);
	});

	it('parseAPIContextFormDataToObject: should parse and decode FormData with schema', async () => {
		// @ts-expect-error - Testing with partial mock
		const effect = parseAPIContextFormDataToObject(mockAPIContext, dummySchema);
		const result = await Effect.runPromise(effect);
		expect(result).toEqual({ foo: 'bar', file: mockFormData.get('file') });
	});

	it('parseAPIContextFormDataToObject: should parse FormData without schema', async () => {
		// @ts-expect-error - Testing with partial mock
		const effect = parseAPIContextFormDataToObject(mockAPIContext);
		const result = await Effect.runPromise(effect as Effect.Effect<unknown, Error, never>);
		expect(result).toEqual({ foo: 'bar', file: mockFormData.get('file') });
	});

	it('parseAPIContextFormDataToObject: should fail if FormData parsing fails', async () => {
		const badContext = {
			request: {
				formData: async () => {
					throw new Error('bad');
				},
			},
		};
		// @ts-expect-error - Testing with partial mock
		const effect = parseAPIContextFormDataToObject(badContext);
		await expect(Effect.runPromise(effect as Effect.Effect<unknown, Error, never>)).rejects.toThrow(
			/Failed to read form data/
		);
	});

	it('parseFormDataEntryToString: should return string value for key', async () => {
		const effect = parseFormDataEntryToString(mockFormData, 'foo');
		const result = await Effect.runPromise(effect);
		expect(result).toBe('bar');
	});

	it('parseFormDataEntryToString: should return null for non-string value', async () => {
		const effect = parseFormDataEntryToString(mockFormData, 'file');
		const result = await Effect.runPromise(effect);
		expect(result).toBeNull();
	});

	it('parseFormDataEntryToString: should return null for missing key', async () => {
		const effect = parseFormDataEntryToString(mockFormData, 'missing');
		const result = await Effect.runPromise(effect);
		expect(result).toBeNull();
	});
});
