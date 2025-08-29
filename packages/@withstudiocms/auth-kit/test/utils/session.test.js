import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { runEffect } from '@withstudiocms/effect';
import {
	defaultSessionConfig,
	makeExpirationDate,
	makeSessionId,
} from '../../dist/utils/session.js';

describe('Session Utils', () => {
	test('defaultSessionConfig has correct defaults', () => {
		assert.equal(typeof defaultSessionConfig.expTime, 'number');
		assert.equal(defaultSessionConfig.cookieName, 'auth_session');
		assert.ok(defaultSessionConfig.expTime > 0);
	});

	test('makeSessionId returns a valid hex string for a token', async () => {
		const token = 'test-token-123';
		const sessionId = await runEffect(makeSessionId(token));
		assert.equal(typeof sessionId, 'string');
		assert.match(sessionId, /^[a-f0-9]{64}$/);
	});

	test('makeSessionId throws SessionError if input is not a string', async () => {
		const err = await runEffect(makeSessionId(undefined)).catch((e) => JSON.stringify(e));
		const parsedErr = JSON.parse(err);
		assert(parsedErr && parsedErr.cause.failure._tag === 'SessionError');
	});

	test('makeExpirationDate returns a Date in the future', async () => {
		const expTime = 1000 * 60 * 60; // 1 hour
		const date = await runEffect(makeExpirationDate(expTime));
		assert(date instanceof Date);
		assert(date.getTime() > Date.now());
	});

	test('makeExpirationDate throws SessionError if expTime is not a number', async () => {
		const err = await runEffect(makeExpirationDate(undefined)).catch((e) => JSON.stringify(e));
		const parsedErr = JSON.parse(err);
		assert(parsedErr && parsedErr.cause.failure._tag === 'SessionError');
	});
});
