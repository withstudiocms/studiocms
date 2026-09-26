import * as allure from 'allure-js-commons';
import { AstroError } from 'astro/errors';
import { describe, expect, test } from 'vitest';
import { ComponentProxyError, prefixError, toComponentProxyError } from '../src/errors.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Error Tests';

describe(parentSuiteName, () => {
	test('Errors - ComponentProxyError - Basic Properties', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ComponentProxyError Tests');
		await allure.tags(...sharedTags);

		await allure.step('Create ComponentProxyError and verify properties', async () => {
			const err = new ComponentProxyError('msg', 'hint', 'stacktrace');
			expect(err).toBeInstanceOf(ComponentProxyError);
			expect(err.message).toBe('msg');
			expect(err.hint).toBe('hint');
			expect(err.stack).toBe('stacktrace');
			expect(err.name).toBe('Component Proxy Error');
		});
	});

	test('Errors - ComponentProxyError - Inherit from AstroError', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ComponentProxyError Tests');
		await allure.tags(...sharedTags);

		await allure.step('Verify ComponentProxyError inherits from AstroError', async () => {
			const err = new ComponentProxyError('msg', 'hint');
			expect(err).toBeInstanceOf(ComponentProxyError);
			expect(err).toBeInstanceOf(AstroError);
		});
	});

	test('Errors - prefixError - Basic Functionality', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('prefixError Tests');
		await allure.tags(...sharedTags);

		await allure.step('Verify prefixError adds prefix to error message', async () => {
			const originalError = new Error('original message');
			const prefixedError = prefixError(originalError, 'PREFIX');
			expect(prefixedError.message).toBe('PREFIX:\noriginal message');
			expect(prefixedError).toBe(originalError);
		});
	});

	test('Errors - prefixError - Handle errors without message property', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('prefixError Tests');
		await allure.tags(...sharedTags);

		await allure.step('Verify prefixError handles errors without message property', async () => {
			const err = {} as Error;
			const result = prefixError(err, 'PFX');
			expect(result).toBeInstanceOf(Error);
			expect(result.message.startsWith('PFX')).toBe(true);
		});
	});

	test('Errors - prefixError - Should preserve stack and cause if possible', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('prefixError Tests');
		await allure.tags(...sharedTags);

		await allure.step('Verify prefixError preserves stack and cause', async () => {
			const err = new Error('fail');
			err.stack = 'stacktrace';
			err.cause = new Error('cause');
			const result = prefixError(err, 'PFX');
			expect(result.stack).toBe('stacktrace');
			// cause may not be set if the original error had a message property
			// so only check if it's a new error
			if (result !== err) {
				expect(result.cause).toBe(err);
			}
		});
	});

	test('Errors - prefixError - Should handle undefined error gracefully', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('prefixError Tests');
		await allure.tags(...sharedTags);

		await allure.step('Verify prefixError handles undefined error gracefully', async () => {
			// @ts-expect-error we are breaking this on purpose
			const result = prefixError(undefined, 'PFX');
			expect(result).toBeInstanceOf(Error);
			expect(result.message.startsWith('PFX')).toBe(true);
		});
	});

	test('Errors - toComponentProxyError - Basic Functionality', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('toComponentProxyError Tests');
		await allure.tags(...sharedTags);

		await allure.step(
			'Verify toComponentProxyError wraps error with prefix and returns ComponentProxyError',
			async () => {
				const original = new Error('original error');
				original.stack = 'stacktrace';
				const result = toComponentProxyError(original, 'PREFIX');
				expect(result).toBeInstanceOf(ComponentProxyError);
				expect(result?.message).toBe('PREFIX:\noriginal error');
				expect(result?.hint).toBe('PREFIX:\noriginal error');
				expect(result?.stack).toBe('stacktrace');
				expect(result?.name).toBe('Component Proxy Error');
			}
		);
	});

	test('Errors - toComponentProxyError - Handle errors without message property', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('toComponentProxyError Tests');
		await allure.tags(...sharedTags);

		await allure.step(
			'Verify toComponentProxyError handles errors without message property',
			async () => {
				const err = {} as Error;

				const result = toComponentProxyError(err, 'PFX');
				expect(result).toBeInstanceOf(ComponentProxyError);
				expect(result.message.startsWith('PFX')).toBe(true);
				expect(result.hint?.startsWith('PFX')).toBe(true);
			}
		);
	});

	test('Errors - toComponentProxyError - Handle undefined error gracefully', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('toComponentProxyError Tests');
		await allure.tags(...sharedTags);

		await allure.step(
			'Verify toComponentProxyError handles undefined error gracefully',
			async () => {
				// @ts-expect-error we are breaking this on purpose
				const result = toComponentProxyError(undefined, 'PFX');
				expect(result).toBeInstanceOf(ComponentProxyError);
				expect(result.message.startsWith('PFX')).toBe(true);
				expect(result.hint?.startsWith('PFX')).toBe(true);
			}
		);
	});
});
