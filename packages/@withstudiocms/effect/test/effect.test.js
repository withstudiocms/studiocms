import assert from 'node:assert';
import { describe, it } from 'node:test';
import { appendSearchParamsToUrl, Effect, runEffect } from '../dist/effect.js';

describe('Effect Utilities', () => {
	it('runEffect resolves Effect with value', async () => {
		const effect = Effect.succeed(42);
		const result = await runEffect(effect);
		assert.strictEqual(result, 42);
	});

	it('runEffect rejects Effect with error', async () => {
		const errorEffect = Effect.fail('error!');
		await assert.rejects(() => runEffect(errorEffect), {
			message: 'error!',
		});
	});

	it('appendSearchParamsToUrl (curried) appends param', () => {
		const url = new URL('https://example.com');
		const appendParam = appendSearchParamsToUrl('foo', 'bar');
		const resultUrl = appendParam(url);
		assert.strictEqual(resultUrl.searchParams.get('foo'), 'bar');
		assert.strictEqual(resultUrl.toString(), 'https://example.com/?foo=bar');
	});

	it('appendSearchParamsToUrl (uncurried) appends param', () => {
		const url = new URL('https://example.com');
		const resultUrl = appendSearchParamsToUrl(url, 'baz', 'qux');
		assert.strictEqual(resultUrl.searchParams.get('baz'), 'qux');
		assert.strictEqual(resultUrl.toString(), 'https://example.com/?baz=qux');
	});
});
