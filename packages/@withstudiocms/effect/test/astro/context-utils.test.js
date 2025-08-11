import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	parseAPIContextFormDataToObject,
	parseAPIContextJson,
	parseFormDataEntryToString,
	readAPIContextFormData,
	readAPIContextJson,
} from '../../dist/astro/context-utils.js';
import { Effect, Schema } from '../../dist/effect.js';

// Mocks
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
		const effect = readAPIContextJson(mockAPIContext);
		const result = await Effect.runPromise(effect);
		assert.deepEqual(result, mockJson);
	});

	it('readAPIContextJson: should fail if request.json throws', async () => {
		const badContext = {
			request: {
				json: async () => {
					throw new Error('bad');
				},
			},
		};
		const effect = readAPIContextJson(badContext);
		await assert.rejects(Effect.runPromise(effect), /Failed to parse JSON from Request/);
	});

	it('parseAPIContextJson: should parse and decode JSON with schema', async () => {
		const effect = parseAPIContextJson(mockAPIContext, dummySchema);
		const result = await Effect.runPromise(effect);
		assert.deepEqual(result, mockJson);
	});

	it('parseAPIContextJson: should parse JSON without schema', async () => {
		const effect = parseAPIContextJson(mockAPIContext);
		const result = await Effect.runPromise(effect);
		assert.deepEqual(result, mockJson);
	});

	it('parseAPIContextJson: should fail if JSON parsing fails', async () => {
		const badContext = {
			request: {
				json: async () => {
					throw new Error('bad');
				},
			},
		};
		const effect = parseAPIContextJson(badContext);
		await assert.rejects(Effect.runPromise(effect), /Failed to read JSON/);
	});

	it('readAPIContextFormData: should parse FormData from request', async () => {
		const effect = readAPIContextFormData(mockAPIContext);
		const result = await Effect.runPromise(effect);
		assert.equal(result.get('foo'), 'bar');
	});

	it('readAPIContextFormData: should fail if request.formData throws', async () => {
		const badContext = {
			request: {
				formData: async () => {
					throw new Error('bad');
				},
			},
		};
		const effect = readAPIContextFormData(badContext);
		await assert.rejects(Effect.runPromise(effect), /Failed to parse formData from Request/);
	});

	it('parseAPIContextFormDataToObject: should parse and decode FormData with schema', async () => {
		const effect = parseAPIContextFormDataToObject(
			mockAPIContext,
			dummySchema
		);
		const result = await Effect.runPromise(effect);
		assert.deepEqual(result, { foo: 'bar', file: mockFormData.get('file') });
	});

	it('parseAPIContextFormDataToObject: should parse FormData without schema', async () => {
		const effect = parseAPIContextFormDataToObject(
			mockAPIContext
		);
		const result = await Effect.runPromise(effect);
		assert.deepEqual(result, { foo: 'bar', file: mockFormData.get('file') });
	});

	it('parseAPIContextFormDataToObject: should fail if FormData parsing fails', async () => {
		const badContext = {
			request: {
				formData: async () => {
					throw new Error('bad');
				},
			},
		};
		const effect = parseAPIContextFormDataToObject(badContext);
		await assert.rejects(Effect.runPromise(effect), /Failed to read form data/);
	});

	it('parseFormDataEntryToString: should return string value for key', async () => {
		const effect = parseFormDataEntryToString(mockFormData, 'foo');
		const result = await Effect.runPromise(effect);
		assert.equal(result, 'bar');
	});

	it('parseFormDataEntryToString: should return null for non-string value', async () => {
		const effect = parseFormDataEntryToString(mockFormData, 'file');
		const result = await Effect.runPromise(effect);
		assert.equal(result, null);
	});

	it('parseFormDataEntryToString: should return null for missing key', async () => {
		const effect = parseFormDataEntryToString(mockFormData, 'missing');
		const result = await Effect.runPromise(effect);
		assert.equal(result, null);
	});

});
