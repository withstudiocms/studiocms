/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { runEffect } from '@withstudiocms/effect';
import { describe, expect, it } from 'vitest';
import {
	defaultSessionConfig,
	makeExpirationDate,
	makeSessionId,
} from '../../src/utils/session.js';

describe('Session Utils', () => {
	it('defaultSessionConfig has correct defaults', () => {
		expect(typeof defaultSessionConfig.expTime).toBe('number');
		expect(defaultSessionConfig.cookieName).toBe('auth_session');
		expect(defaultSessionConfig.expTime).toBeGreaterThan(0);
	});

	it('makeSessionId returns a valid hex string for a token', async () => {
		const token = 'test-token-123';
		const sessionId = await runEffect(makeSessionId(token));
		expect(typeof sessionId).toBe('string');
		expect(sessionId).toMatch(/^[a-f0-9]{64}$/);
	});

	it('makeSessionId throws SessionError if input is not a string', async () => {
		// @ts-expect-error - Testing response to invalid type
		const err = await runEffect(makeSessionId(undefined)).catch((e) => JSON.stringify(e));
		const parsedErr = JSON.parse(err);
		expect(parsedErr.cause.failure._tag).toBe('SessionError');
	});

	it('makeExpirationDate returns a Date in the future', async () => {
		const expTime = 1000 * 60 * 60; // 1 hour
		const date = await runEffect(makeExpirationDate(expTime));
		expect(date).toBeInstanceOf(Date);
		expect(date.getTime()).toBeGreaterThan(Date.now());
	});

	it('makeExpirationDate throws SessionError if expTime is not a number', async () => {
		// @ts-expect-error - Testing response to invalid type
		const err = await runEffect(makeExpirationDate(undefined)).catch((e) => JSON.stringify(e));
		const parsedErr = JSON.parse(err as string);
		expect(parsedErr.cause.failure._tag).toBe('SessionError');
	});
});
