import { beforeEach, describe, expect, it, vi } from '@effect/vitest';
import * as clack from '../src/clack';
import { Effect } from '../src/effect.js';

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
});
