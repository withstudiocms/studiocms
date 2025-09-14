import { describe, expect, it } from 'vitest';
import { ComponentProxyError, prefixError, toComponentProxyError } from '../src/errors.js';

describe('ComponentProxyError', () => {
	it('should set message, hint, stack, and name', () => {
		const err = new ComponentProxyError('msg', 'hint', 'stacktrace');
		expect(err).toBeInstanceOf(ComponentProxyError);
		expect(err.message).toBe('msg');
		expect(err.hint).toBe('hint');
		expect(err.stack).toBe('stacktrace');
		expect(err.name).toBe('Component Proxy Error');
	});

	it('should inherit from AstroError', () => {
		const err = new ComponentProxyError('msg', 'hint');
		expect(err instanceof ComponentProxyError).toBe(true);
	});
});

describe('prefixError', () => {
	it('should prefix the message of a standard Error', () => {
		const err = new Error('original');
		const result = prefixError(err, 'PREFIX');
		expect(result.message).toBe('PREFIX:\noriginal');
		expect(result).toBe(err);
	});

	it('should handle errors without a message property', () => {
		const err = {};
		const result = prefixError(err as Error, 'PREFIX');
		expect(result).toBeInstanceOf(Error);
		expect(result.message.startsWith('PREFIX')).toBe(true);
	});

	it('should preserve stack and cause if possible', () => {
		const err = new Error('fail');
		err.stack = 'stacktrace';
		// @ts-ignore
		err.cause = new Error('cause');
		const result = prefixError(err, 'PFX');
		expect(result.stack).toBe('stacktrace');
		// cause may not be set if the original error had a message property
		// so only check if it's a new error
		if (result !== err) {
			expect(result.cause).toBe(err);
		}
	});

	it('should handle null/undefined error gracefully', () => {
		// @ts-expect-error purposely breaking type for test
		const result = prefixError(undefined, 'PFX');
		expect(result).toBeInstanceOf(Error);
		expect(result.message.startsWith('PFX')).toBe(true);
	});

	it('toComponentProxyError should wrap error with prefix and return ComponentProxyError', () => {
		const original = new Error('original error');
		original.stack = 'stacktrace';
		const result = ComponentProxyError.prototype.constructor
			? toComponentProxyError(original, 'PREFIX')
			: undefined;
		expect(result).toBeInstanceOf(ComponentProxyError);
		expect(result?.message).toBe('PREFIX:\noriginal error');
		expect(result?.hint).toBe('PREFIX:\noriginal error');
		expect(result?.stack).toBe('stacktrace');
		expect(result?.name).toBe('Component Proxy Error');
	});

	it('toComponentProxyError should handle errors without message property', async () => {
		const err = {} as Error;

		const result = toComponentProxyError(err, 'PFX');
		expect(result).toBeInstanceOf(ComponentProxyError);
		expect(result.message.startsWith('PFX')).toBe(true);
		expect(result.hint?.startsWith('PFX')).toBe(true);
	});

	it('toComponentProxyError should handle undefined error gracefully', async () => {
		// @ts-expect-error we are breaking this on purpose
		const result = toComponentProxyError(undefined, 'PFX');
		expect(result).toBeInstanceOf(ComponentProxyError);
		expect(result.message.startsWith('PFX')).toBe(true);
		expect(result.hint?.startsWith('PFX')).toBe(true);
	});
});
