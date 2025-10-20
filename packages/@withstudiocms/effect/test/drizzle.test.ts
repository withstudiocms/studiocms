import * as allure from 'allure-js-commons';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
	DrizzleClient,
	type DrizzleDBClientService,
	drizzleDBClientLive,
	type ExecuteFn,
	LibSQLClientError,
	type TransactionClient,
	TransactionContext,
} from '../src/drizzle.js';
import { Effect, Exit } from '../src/effect.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'Drizzle Service Tests';

describe(parentSuiteName, () => {
	let drizzle: LibSQLDatabase;
	let schema: Record<string, unknown>;
	let service: typeof DrizzleDBClientService.Service;

	beforeEach(async () => {
		drizzle = {
			select: vi.fn(),
		} as unknown as LibSQLDatabase;
		schema = { users: {} };
		service = await Effect.runPromise(drizzleDBClientLive({ drizzle, schema }));
	});

	test('Drizzle - LibSQLClientError sets tag and cause', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('LibSQLClientError Tests');
		await allure.tags(...sharedTags);

		const cause = new Error('fail');
		const err = new LibSQLClientError({ cause });

		await allure.step('Checking LibSQLClientError properties', async (ctx) => {
			await ctx.parameter('Expected Tag', 'LibSQLClientError');
			await ctx.parameter('Expected Cause Message', cause.message);

			expect(err._tag).toBe('LibSQLClientError');
			expect(err.cause).toBe(cause);
		});
	});

	test('Drizzle - DrizzleClient creates context tag correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('DrizzleClient Tests');
		await allure.tags(...sharedTags);

		const config = { drizzle: {} as LibSQLDatabase, schema: {} };
		const tag = DrizzleClient.of(config);

		await allure.step('Checking DrizzleClient properties', async (ctx) => {
			await ctx.parameter('Drizzle Config Provided', 'true');

			expect(tag.drizzle).toBe(config.drizzle);
			expect(tag.schema).toBe(config.schema);
		});
	});

	test('Drizzle - TransactionContext has default implementation', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('TransactionContext Tests');
		await allure.tags(...sharedTags);

		const txFn = vi
			.fn()
			.mockImplementation((fn) => Effect.tryPromise(() => fn({} as TransactionClient)));

		await allure.step('Checking TransactionContext default implementation', async (ctx) => {
			await ctx.parameter('Transaction Function Created', 'true');

			const provided = TransactionContext.provide(txFn)(Effect.succeed('test'));
			const result = await Effect.runPromise(provided);

			expect(result).toBe('test');
		});
	});

	test('Drizzle - drizzleDBClientLive provides DrizzleDBClientService', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('drizzleDBClientLive Tests');
		await allure.tags(...sharedTags);

		const drizzle = {} as LibSQLDatabase;
		const schema = { users: {} };

		await allure.step('Creating DrizzleDBClientService via drizzleDBClientLive', async (ctx) => {
			await ctx.parameter('Drizzle Config Provided', 'true');

			const effect = drizzleDBClientLive({ drizzle, schema });
			const service = await Effect.runPromise(effect);

			expect(service.makeQuery).toBeTypeOf('function');
			expect(service.execute).toBeTypeOf('function');
		});
	});

	[
		{
			name: 'Drizzle - execute - resolves with function result',
			fn: vi.fn().mockResolvedValue('ok'),
			expected: 'ok',
		},
		{
			name: 'Drizzle - execute - fails with LibSQLClientError on error',
			fn: vi.fn().mockRejectedValue(new Error('fail')),
			expectedError: LibSQLClientError,
			error: new Error('fail'),
		},
	].forEach(({ name, fn, expected, expectedError, error }) => {
		test(name, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('DrizzleDBClientService.execute Tests');
			await allure.tags(...sharedTags);

			if (expected !== undefined) {
				await allure.step('Executing function and expecting resolution', async (ctx) => {
					await ctx.parameter('Expected', String(expected));
					const effect = service.execute(fn);
					const result = await Effect.runPromise(effect);
					await ctx.parameter('Result', String(result));
					expect(result).toBe(expected);
				});
			} else if (expectedError !== undefined) {
				await allure.step('Executing function and expecting failure', async () => {
					const effect = service.execute(fn);
					await expect(Effect.runPromiseExit(effect)).resolves.toEqual(
						Exit.fail(new LibSQLClientError({ cause: error }))
					);
				});
			}
		});
	});

	test('Drizzle - makeQuery - Should call queryFn with execute and input', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('DrizzleDBClientService.makeQuery Tests');
		await allure.tags(...sharedTags);

		const queryFn = vi
			.fn()
			.mockImplementation((exec: ExecuteFn, input: number) =>
				exec((client) => Promise.resolve(client === drizzle ? input * 2 : 0))
			);
		const getDouble = service.makeQuery(queryFn);

		await allure.step('Making query with input 21 and expecting result 42', async (ctx) => {
			await ctx.parameter('Input', '21');
			// @ts-expect-error input is number
			// @effect-diagnostics-next-line missingEffectContext:off
			const result = await Effect.runPromise(getDouble(21));
			await ctx.parameter('Result', String(result));
			expect(result).toBe(42);
			expect(queryFn).toHaveBeenCalled();
		});
	});

	test('Drizzle - makeQuery - Should use TransactionContext if available', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('DrizzleDBClientService.makeQuery with TransactionContext Tests');
		await allure.tags(...sharedTags);

		const txClient = {} as TransactionClient;
		const txFn = vi.fn().mockImplementation((fn) => Effect.tryPromise(() => fn(txClient)));
		const queryFn = vi
			.fn()
			.mockImplementation((exec: ExecuteFn, input: string) =>
				exec((client) => Promise.resolve(client === txClient ? input + '-tx' : input))
			);
		const getTx = service.makeQuery(queryFn);

		await allure.step('Making query with TransactionContext and input "foo"', async (ctx) => {
			await ctx.parameter('Input', 'foo');
			const effect = Effect.provideService(TransactionContext, txFn)(getTx('foo'));
			// @ts-expect-error input is number
			// @effect-diagnostics-next-line missingEffectContext:off
			const result = await Effect.runPromise(effect);
			await ctx.parameter('Result', String(result));
			expect(result).toBe('foo-tx');
			expect(queryFn).toHaveBeenCalled();
		});
	});

	test('Drizzle - makeQuery - Should work with no input', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('DrizzleDBClientService.makeQuery No Input Tests');
		await allure.tags(...sharedTags);

		const queryFn = vi
			.fn()
			.mockImplementation((exec: ExecuteFn, _input: never) =>
				exec((client) => Promise.resolve(client === drizzle ? 'no-input' : 'wrong'))
			);
		const getNoInput = service.makeQuery(queryFn);

		await allure.step('Making query with no input and expecting "no-input"', async (ctx) => {
			// @ts-expect-error input is number
			// @effect-diagnostics-next-line missingEffectContext:off
			const result = await Effect.runPromise(getNoInput());
			await ctx.parameter('Result', String(result));
			expect(result).toBe('no-input');
			expect(queryFn).toHaveBeenCalled();
		});
	});
});
