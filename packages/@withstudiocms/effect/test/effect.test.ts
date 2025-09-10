import { describe, expect, it } from 'vitest';
import { appendSearchParamsToUrl, Effect, runEffect } from '../src/effect.js';

describe('Effect Utilities', () => {
	it('runEffect resolves Effect with value', async () => {
		const effect = Effect.succeed(42);
		const result = await runEffect(effect);
		expect(result).toBe(42);
	});

	it('runEffect rejects Effect with error', async () => {
		const errorEffect = Effect.fail('error!');
		await expect(runEffect(errorEffect)).rejects.toThrow('error!');
	});

	it('appendSearchParamsToUrl (curried) appends param', () => {
		const url = new URL('https://example.com');
		const appendParam = appendSearchParamsToUrl('foo', 'bar');
		const resultUrl = appendParam(url);
		expect(resultUrl.searchParams.get('foo')).toBe('bar');
		expect(resultUrl.toString()).toBe('https://example.com/?foo=bar');
	});

	it('appendSearchParamsToUrl (uncurried) appends param', () => {
		const url = new URL('https://example.com');
		const resultUrl = appendSearchParamsToUrl(url, 'baz', 'qux');
		expect(resultUrl.searchParams.get('baz')).toBe('qux');
		expect(resultUrl.toString()).toBe('https://example.com/?baz=qux');
	});
});
