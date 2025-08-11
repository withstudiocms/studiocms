import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defineAPIRoute } from '../../dist/astro/api-route.js';
import { Effect } from '../../dist/effect.js';

describe('api-route tests', () => {
	it('defineAPIRoute: should call fn with context and return the response from runEffect', async () => {
		const mockContext = {};
		const mockResponse = new Response('ok', { status: 200 });

		let calledWith;
		const fn = (ctx) => {
			calledWith = ctx;
			return Effect.succeed(mockResponse);
		};
		const handler = defineAPIRoute(mockContext);

		const result = await handler(fn);

		assert.strictEqual(calledWith, mockContext);
		assert.strictEqual(result, mockResponse);
	});

	it('defineAPIRoute: should propagate errors from runEffect', async () => {
		const mockContext = {};
		const error = new Error('fail');

		const fn = () => Effect.fail(error);
		const handler = defineAPIRoute(mockContext);

		await assert.rejects(() => handler(fn), { message: 'fail' });
	});

})

