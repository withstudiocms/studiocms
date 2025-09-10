import { Effect, runEffect } from '@withstudiocms/effect';
import { describe, expect, it } from 'vitest';
import { CheckIfUnsafe } from '../../src/utils/unsafeCheck.js';

describe('CheckIfUnsafe Utils', () => {
	it('CheckIfUnsafe.username returns true for a reserved username', async () => {
		const effect = Effect.gen(function* () {
			const service = yield* CheckIfUnsafe;
			return service;
		}).pipe(Effect.provide(CheckIfUnsafe.Default));

		const service = await runEffect(effect);
		const result = await runEffect(service.username('admin'));
		expect(result).toBe(true);
	});

	it('CheckIfUnsafe.username returns false for a non-reserved username', async () => {
		const effect = Effect.gen(function* () {
			const service = yield* CheckIfUnsafe;
			return service;
		}).pipe(Effect.provide(CheckIfUnsafe.Default));

		const service = await runEffect(effect);
		const result = await runEffect(service.username('not_reserved_user'));
		expect(result).toBe(false);
	});

	it('CheckIfUnsafe.password returns true for a common password', async () => {
		const effect = Effect.gen(function* () {
			const service = yield* CheckIfUnsafe;
			return service;
		}).pipe(Effect.provide(CheckIfUnsafe.Default));

		const service = await runEffect(effect);
		const result = await runEffect(service.password('password'));
		expect(result).toBe(true);
	});

	it('CheckIfUnsafe.password returns false for a non-common password', async () => {
		const effect = Effect.gen(function* () {
			const service = yield* CheckIfUnsafe;
			return service;
		}).pipe(Effect.provide(CheckIfUnsafe.Default));

		const service = await runEffect(effect);
		const result = await runEffect(service.password('uniquepassword123'));
		expect(result).toBe(false);
	});
});
