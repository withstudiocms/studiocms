import { beforeEach, describe, expect, it, vi } from '@effect/vitest';
import * as clack from '../src/clack';
import { Effect, Exit } from '../src/effect.js';

describe('clack', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe('ClackError', () => {
		it.effect('should create a ClackError with cause', () =>
			Effect.sync(() => {
				const err = new clack.ClackError({ cause: 'fail' });
				expect(err._tag).toBe('ClackError');
				expect(err.cause).toBe('fail');
			})
		);
	});

	describe('useClackError', () => {
		it.effect('returns Effect that succeeds with value if no error is thrown', () =>
			Effect.gen(function* () {
				const result = yield* clack.useClackError(() => 42);
				expect(result).toBe(42);
			})
		);

		it.effect('returns Effect that fails with ClackError if error is thrown', () =>
			Effect.gen(function* () {
				const error = new Error('fail!');

				const result = yield* Effect.exit(
					clack.useClackError(() => {
						throw error;
					})
				);

				expect(result).toStrictEqual(Exit.fail(new clack.ClackError({ cause: error })));
			})
		);
	});

	describe('useClackErrorPromise', () => {
		it.effect('returns Effect that succeeds with resolved value', () =>
			Effect.gen(function* () {
				const result = yield* clack.useClackErrorPromise(() => Promise.resolve('ok'));
				expect(result).toBe('ok');
			})
		);

		it.effect('returns Effect that fails with ClackError if promise rejects', () =>
			Effect.gen(function* () {
				const error = new Error('fail!');
				const result = yield* Effect.exit(clack.useClackErrorPromise(() => Promise.reject(error)));
				expect(result).toStrictEqual(Exit.fail(new clack.ClackError({ cause: error })));
			})
		);
	});
});
