import type { Database } from '@astrojs/db/runtime';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('LibSQLClientError', () => {
	it('should set the tag and cause', () => {
		const cause = new Error('fail');
		const err = new LibSQLClientError({ cause });
		expect(err._tag).toBe('LibSQLClientError');
		expect(err.cause).toBe(cause);
	});
});

describe('drizzleDBClientLive', () => {
	let drizzle: LibSQLDatabase | Database;
	let schema: Record<string, unknown>;

	beforeEach(() => {
		drizzle = {} as LibSQLDatabase;
		schema = { users: {} };
	});

	it('should provide DrizzleDBClientService with config', async () => {
		const effect = drizzleDBClientLive({ drizzle, schema });
		const result = await Effect.runPromise(effect);
		expect(result.makeQuery).toBeTypeOf('function');
		expect(result.execute).toBeTypeOf('function');
	});
});

describe('DrizzleDBClientService', () => {
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

	describe('execute', () => {
		it('should resolve with the result of the function', async () => {
			const fn = vi.fn().mockResolvedValue('ok');
			const effect = service.execute(fn);
			const result = await Effect.runPromise(effect);
			expect(result).toBe('ok');
			expect(fn).toHaveBeenCalledWith(drizzle);
		});

		it('should fail with LibSQLClientError on error', async () => {
			const error = new Error('fail');
			const fn = vi.fn().mockRejectedValue(error);
			const effect = service.execute(fn);
			await expect(Effect.runPromiseExit(effect)).resolves.toEqual(
				Exit.fail(new LibSQLClientError({ cause: error }))
			);
		});
	});

	describe('makeQuery', () => {
		it('should call queryFn with execute and input', async () => {
			const queryFn = vi
				.fn()
				.mockImplementation((exec: ExecuteFn, input: number) =>
					exec((client) => Promise.resolve(client === drizzle ? input * 2 : 0))
				);
			const getDouble = service.makeQuery(queryFn);
			// @ts-expect-error input is number
			// @effect-diagnostics-next-line missingEffectContext:off
			const result = await Effect.runPromise(getDouble(21));
			expect(result).toBe(42);
			expect(queryFn).toHaveBeenCalled();
		});

		it('should use TransactionContext if available', async () => {
			const txClient = {} as TransactionClient;
			const txFn = vi.fn().mockImplementation((fn) => Effect.tryPromise(() => fn(txClient)));
			const queryFn = vi
				.fn()
				.mockImplementation((exec: ExecuteFn, input: string) =>
					exec((client) => Promise.resolve(client === txClient ? input + '-tx' : input))
				);
			const getTx = service.makeQuery(queryFn);

			const effect = Effect.provideService(TransactionContext, txFn)(getTx('foo'));
			// @ts-expect-error input is number
			// @effect-diagnostics-next-line missingEffectContext:off
			const result = await Effect.runPromise(effect);
			expect(result).toBe('foo-tx');
			expect(queryFn).toHaveBeenCalled();
		});

		it('should work with no input', async () => {
			const queryFn = vi
				.fn()
				.mockImplementation((exec: ExecuteFn, _input: never) =>
					exec((_client) => Promise.resolve('no-input'))
				);
			const getNoInput = service.makeQuery(queryFn);
			// @ts-expect-error input is number
			// @effect-diagnostics-next-line missingEffectContext:off
			const result = await Effect.runPromise(getNoInput());
			expect(result).toBe('no-input');
			expect(queryFn).toHaveBeenCalled();
		});
	});
});

describe('DrizzleClient', () => {
	it('should create a context tag', () => {
		const config = { drizzle: {} as LibSQLDatabase, schema: {} };
		const tag = DrizzleClient.of(config);
		expect(tag.drizzle).toBe(config.drizzle);
		expect(tag.schema).toBe(config.schema);
	});
});

describe('TransactionContext', () => {
	it('should provide a transaction context', async () => {
		const txFn = vi
			.fn()
			.mockImplementation((fn) => Effect.tryPromise(() => fn({} as TransactionClient)));
		const effect = Effect.succeed('ok');
		const provided = TransactionContext.provide(txFn)(effect);
		const result = await Effect.runPromise(provided);
		expect(result).toBe('ok');
	});
});
