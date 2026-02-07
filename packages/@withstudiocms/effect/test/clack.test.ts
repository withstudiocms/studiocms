import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import * as clack from '../src/clack';
import { Effect, Exit } from '../src/effect.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Clack Wrapper Tests';

describe(parentSuiteName, () => {
	test('Clack - ClackError sets tag and cause', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('ClackError Tests');
		await allure.tags(...sharedTags);

		const cause = new Error('fail');
		const err = new clack.ClackError({ cause });

		await allure.step('Checking ClackError properties', async (ctx) => {
			await ctx.parameter('Expected Tag', 'ClackError');
			await ctx.parameter('Expected Cause Message', cause.message);

			expect(err._tag).toBe('ClackError');
			expect(err.cause).toBe(cause);
		});
	});

	[
		{
			name: 'Clack - useClackError returns Effect that succeeds with value if no error is thrown',
			fn: () => 42,
			expected: 42,
		},
		{
			name: 'Clack - useClackError returns Effect that fails with ClackError if error is thrown',
			fn: () => {
				throw new Error('fail!');
			},
			expected: new Error('fail!'),
		},
	].forEach(({ name, fn, expected }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('useClackError Tests');
			await allure.tags(...sharedTags);

			if (typeof expected === 'number') {
				await allure.step('Running useClackError and expecting success', async (ctx) => {
					await ctx.parameter('Expected', String(expected));
					const result = await Effect.runPromise(clack.useClackError(fn));
					await ctx.parameter('Result', String(result));
					expect(result).toBe(expected);
				});
			} else {
				await allure.step('Running useClackError and expecting failure', async () => {
					const result = await Effect.runPromiseExit(clack.useClackError(fn));
					expect(result).toStrictEqual(Exit.fail(new clack.ClackError({ cause: expected })));
				});
			}
		});
	});

	[
		{
			name: 'Clack - useClackErrorPromise returns Effect that succeeds with value if no error is thrown',
			fn: () => Promise.resolve('ok'),
			expected: 'ok',
		},
		{
			name: 'Clack - useClackErrorPromise returns Effect that fails with ClackError if error is thrown',
			fn: () => Promise.reject(new Error('fail!')),
			expected: new Error('fail!'),
		},
	].forEach(({ name, fn, expected }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('useClackErrorPromise Tests');
			await allure.tags(...sharedTags);

			if (typeof expected === 'string') {
				await allure.step('Running useClackErrorPromise and expecting success', async (ctx) => {
					await ctx.parameter('Expected', String(expected));
					const result = await Effect.runPromise(clack.useClackErrorPromise(fn as () => any));
					await ctx.parameter('Result', String(result));
					expect(result).toBe(expected);
				});
			} else {
				await allure.step('Running useClackErrorPromise and expecting failure', async () => {
					const result = await Effect.runPromiseExit(clack.useClackErrorPromise(fn as () => any));
					expect(result).toStrictEqual(Exit.fail(new clack.ClackError({ cause: expected })));
				});
			}
		});
	});
});
