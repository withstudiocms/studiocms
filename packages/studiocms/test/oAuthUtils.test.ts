/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { AstroError } from 'astro/errors';
import { describe, expect, it } from 'vitest';
import { Effect, Exit } from '../src/effect.js';
import { getCookie, getUrlParam, ValidateAuthCodeError } from '../src/oAuthUtils';

describe('ValidateAuthCodeError', () => {
	it('should create an error with correct properties', () => {
		const err = new ValidateAuthCodeError({ message: 'Invalid code', provider: 'github' });
		expect(err._tag).toBe('ValidateAuthCodeError');
		expect(err.message).toBe('Invalid code');
		expect(err.provider).toBe('github');
	});
});

describe('getUrlParam', () => {
	it('should return the value of an existing query param', async () => {
		const url = new URL('http://localhost/callback?code=1234');
		const context = { url } as any;
		const effect = getUrlParam(context, 'code');
		const result = await Effect.runPromise(effect);
		expect(result).toBe('1234');
	});

	it('should return null if param does not exist', async () => {
		const url = new URL('http://localhost/callback');
		const context = { url } as any;
		const effect = getUrlParam(context, 'missing');
		const result = await Effect.runPromise(effect);
		expect(result).toBeNull();
	});

	it('should throw AstroError if url is malformed', async () => {
		const context = { url: null } as any;
		const effect = getUrlParam(context, 'code');
		expect(await Effect.runPromiseExit(effect)).toStrictEqual(
			Exit.fail(new AstroError('Failed to parse URL from Astro context'))
		);
	});
});

describe('getCookie', () => {
	it('should return the value of an existing cookie', async () => {
		const cookies = {
			get: (key: string) => (key === 'session' ? { value: 'abc123' } : undefined),
		};
		const context = { cookies } as any;
		const effect = getCookie(context, 'session');
		const result = await Effect.runPromise(effect);
		expect(result).toBe('abc123');
	});

	it('should return null if cookie does not exist', async () => {
		const cookies = {
			get: (_: string) => undefined,
		};
		const context = { cookies } as any;
		const effect = getCookie(context, 'missing');
		const result = await Effect.runPromise(effect);
		expect(result).toBeNull();
	});

	it('should throw AstroError if cookies object is malformed', async () => {
		const context = { cookies: null } as any;
		const effect = getCookie(context, 'session');
		expect(await Effect.runPromiseExit(effect)).toStrictEqual(
			Exit.fail(new AstroError('Failed to parse get Cookies from Astro context'))
		);
	});
});
