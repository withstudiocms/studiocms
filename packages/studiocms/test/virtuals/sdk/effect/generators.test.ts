import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import { SDKCore_Generators } from '../../../../src/virtuals/sdk/effect/generators';
import { SDKCoreError, StudioCMS_SDK_Error } from '../../../../src/virtuals/sdk/errors';

describe('SDKCore_Generators', async () => {
	const generators = await Effect.runPromise(
		Effect.gen(function* () {
			const mod = yield* SDKCore_Generators;
			return mod;
		}).pipe(Effect.provide(SDKCore_Generators.Default))
	);

	it('generateRandomIDNumber returns a number of correct length', async () => {
		const length = 6;
		const result = await Effect.runPromise(generators.generateRandomIDNumber(length));
		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBeLessThan(10 ** length);
		expect(result.toString().length).toBeLessThanOrEqual(length);
	});

	it('generateRandomPassword returns a string of correct length', async () => {
		const length = 12;
		const password = await Effect.runPromise(generators.generateRandomPassword(length));
		expect(password).toHaveLength(length);
		expect(password).toMatch(/^[A-Za-z0-9]+$/);
	});

	it('generateToken returns a JWT string', async () => {
		const token = await Effect.runPromise(generators.generateToken('user123'));
		expect(typeof token).toBe('string');
		expect(token.split('.').length).toBe(3); // JWT format
	});

	it('testToken verifies a valid token', async () => {
		const userId = 'user456';
		const token = await Effect.runPromise(generators.generateToken(userId));
		const result = await Effect.runPromise(generators.testToken(token));
		expect(result.isValid).toBe(true);
		expect(result.userId).toBe(userId);
	});

	it('testToken throws on invalid token', async () => {
		expect(await Effect.runPromiseExit(generators.testToken('invalid.token.value'))).toMatchObject(
			Exit.fail(
				new SDKCoreError({
					type: 'UNKNOWN',
					cause: new StudioCMS_SDK_Error(
						`testToken Error: SyntaxError: Unexpected token '�', "�{ږ'" is not valid JSON]`
					),
				})
			)
		);
	});
});
