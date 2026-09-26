/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import { runEffect } from '@withstudiocms/effect';
import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	defaultSessionConfig,
	makeExpirationDate,
	makeSessionId,
} from '../../src/utils/session.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Session Utility Tests';

describe(parentSuiteName, () => {
	test('Session Utility - defaultSessionConfig', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defaultSessionConfig Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should have correct default values', async () => {
			expect(typeof defaultSessionConfig.expTime).toBe('number');
			expect(defaultSessionConfig.cookieName).toBe('auth_session');
			expect(defaultSessionConfig.expTime).toBeGreaterThan(0);
		});
	});

	test('Session Utility - makeSessionId returns a valid hex string for a token', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('makeSessionId Tests');
		await allure.tags(...sharedTags);

		const token = 'test-token-123';

		await allure.parameter('input token', token);

		await allure.step('Should return a valid hex string', async () => {
			const sessionId = await runEffect(makeSessionId(token));
			expect(typeof sessionId).toBe('string');
			expect(sessionId).toMatch(/^[a-f0-9]{64}$/);
		});
	});

	test('Session Utility - makeSessionId throws SessionError if input is not a string', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('makeSessionId Error Handling Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should throw SessionError for invalid input type', async () => {
			// @ts-expect-error - Testing response to invalid type
			const err = await runEffect(makeSessionId(undefined)).catch((e) => JSON.stringify(e));
			const parsedErr = JSON.parse(err as string);
			expect(parsedErr.cause.failure._tag).toBe('SessionError');
		});
	});

	test('Session Utility - makeExpirationDate returns a Date in the future', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('makeExpirationDate Tests');
		await allure.tags(...sharedTags);

		const expTime = 1000 * 60 * 60; // 1 hour

		await allure.parameter('input expTime (ms)', String(expTime));

		await allure.step('Should return a Date in the future', async () => {
			const date = await runEffect(makeExpirationDate(expTime));
			expect(date).toBeInstanceOf(Date);
			expect(date.getTime()).toBeGreaterThan(Date.now());
		});
	});

	test('Session Utility - makeExpirationDate throws SessionError if expTime is not a number', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('makeExpirationDate Error Handling Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should throw SessionError for invalid input type', async () => {
			// @ts-expect-error - Testing response to invalid type
			const err = await runEffect(makeExpirationDate(undefined)).catch((e) => JSON.stringify(e));
			const parsedErr = JSON.parse(err as string);
			expect(parsedErr.cause.failure._tag).toBe('SessionError');
		});
	});
});
