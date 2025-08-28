import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Effect, runEffect } from '@withstudiocms/effect';
import { CheckIfUnsafe } from '../../dist/utils/unsafeCheck.js';

describe('CheckIfUnsafe Utils', () => {
	test('CheckIfUnsafe.username returns true for a reserved username', async () => {
		const effect = Effect.gen(function* () {
			const service = yield* CheckIfUnsafe;
			return service;
		}).pipe(Effect.provide(CheckIfUnsafe.Default));

		const service = await runEffect(effect);
		// Pick a username you know is in the list, e.g. 'admin'
		const result = await runEffect(service.username('admin'));
		assert.equal(result, true);
	});

	test('CheckIfUnsafe.username returns false for a non-reserved username', async () => {
		const effect = Effect.gen(function* () {
			const service = yield* CheckIfUnsafe;
			return service;
		}).pipe(Effect.provide(CheckIfUnsafe.Default));

		const service = await runEffect(effect);
		const result = await runEffect(service.username('not_reserved_user'));
		assert.equal(result, false);
	});

	test('CheckIfUnsafe.password returns true for a common password', async () => {
		const effect = Effect.gen(function* () {
			const service = yield* CheckIfUnsafe;
			return service;
		}).pipe(Effect.provide(CheckIfUnsafe.Default));

		const service = await runEffect(effect);
		// Pick a password you know is in the list, e.g. 'password'
		const result = await runEffect(service.password('password'));
		assert.equal(result, true);
	});

	test('CheckIfUnsafe.password returns false for a non-common password', async () => {
		const effect = Effect.gen(function* () {
			const service = yield* CheckIfUnsafe;
			return service;
		}).pipe(Effect.provide(CheckIfUnsafe.Default));

		const service = await runEffect(effect);
		const result = await runEffect(service.password('uniquepassword123'));
		assert.equal(result, false);
	});
});
