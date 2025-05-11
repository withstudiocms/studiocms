import { scrypt as nodeScrypt } from 'node:crypto';
import crypto from 'node:crypto';
import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
import { FetchHttpClient, HttpClient } from '@effect/platform';
import { sha1 } from '@oslojs/crypto/sha1';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { Effect, Layer } from 'effect';
import type { UnknownException } from 'effect/Cause';
import { CheckIfUnsafe } from './utils/unsafeCheck.js';

const SCRYPT_N = Number.parseInt(process.env.SCRYPT_N || '16384', 10);
const SCRYPT_R = Number.parseInt(process.env.SCRYPT_R || '8', 10);
const SCRYPT_P = Number.parseInt(process.env.SCRYPT_P || '1', 10);

export class Scrypt extends Effect.Service<Scrypt>()('studiocms/lib/auth/password/Scrypt', {
	effect: Effect.gen(function* () {
		return {
			run: (
				password: crypto.BinaryLike
			): Effect.Effect<Buffer<ArrayBufferLike>, UnknownException, never> =>
				Effect.tryPromise(
					() =>
						new Promise((res, rej) => {
							nodeScrypt(
								password,
								CMS_ENCRYPTION_KEY,
								64,
								{ N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
								(err, derivedKey) => {
									if (err) rej(err);
									else res(derivedKey);
								}
							);
						}) as Promise<Buffer>
				),
		};
	}),
}) {}

export const make = Effect.gen(function* () {
	/**
	 * Old Hash Password function
	 *
	 * @deprecated
	 */
	const legacy0HashPassword = (password: string) =>
		Effect.gen(function* () {
			const scrypt = yield* Scrypt;
			const hashed = yield* scrypt.run(password);
			return hashed.toString();
		}).pipe(Effect.provide(Scrypt.Default));

	/**
	 * Compares two strings in constant time to prevent timing attacks.
	 *
	 * This function ensures that the comparison time is independent of the
	 * input strings' content, making it resistant to timing attacks that
	 * could reveal information about the strings.
	 *
	 * @param a - The first string to compare.
	 * @param b - The second string to compare.
	 * @returns `true` if the strings are equal, `false` otherwise.
	 * @private
	 */
	const constantTimeEqual = (a: string, b: string): boolean => {
		if (a.length !== b.length) return false;
		let result = 0;
		for (let i = 0; i < a.length; i++) {
			result |= a.charCodeAt(i) ^ b.charCodeAt(i);
		}
		return result === 0;
	};

	/**
	 * Hashes a plain text password using script.
	 *
	 * @param password - The plain text password to hash.
	 * @returns A promise that resolves to the hashed password.
	 */
	const hashPassword = (password: string, _salt?: string) =>
		Effect.gen(function* () {
			const scrypt = yield* Scrypt;
			const salt = _salt || crypto.randomBytes(16).toString('hex');
			const hashed = yield* scrypt.run(password + salt);
			return `gen1.0:${salt}:${hashed.toString('hex')}`;
		}).pipe(Effect.provide(Scrypt.Default));

	/**
	 * Verifies if the provided password matches the hashed password.
	 *
	 * @param hash - The hashed password to compare against.
	 * @param password - The plain text password to verify.
	 * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
	 */
	const verifyPasswordHash = (hash: string, password: string) =>
		Effect.gen(function* () {
			if (!hash.startsWith('gen1.0:')) {
				const newHash = yield* legacy0HashPassword(password);
				return constantTimeEqual(hash, newHash);
			}
			const [_prefix, salt] = hash.split(':');
			const newHash = yield* hashPassword(password, salt);
			return constantTimeEqual(hash, newHash);
		});

	/**
	 * @private Internal function for the `verifyPasswordStrength` function
	 */
	const verifyPasswordLength = (pass: string): Effect.Effect<string | undefined, never, never> =>
		pass.length >= 8 && pass.length < 255
			? Effect.succeed(undefined)
			: Effect.succeed('Password must be between 8 and 255 characters');

	/**
	 * @private Internal function for the `verifyPasswordStrength` function
	 */
	const verifySafe = (pass: string) =>
		Effect.gen(function* () {
			const check = yield* CheckIfUnsafe;
			if (check.password(pass)) {
				return 'Password must not be a commonly known unsafe password (admin, root, etc.)';
			}
			return;
		}).pipe(Effect.provide(CheckIfUnsafe.Layer));

	/**
	 * @private Internal function for the `verifyPasswordStrength` function
	 */
	const checkPwnedDB = (pass: string) =>
		Effect.gen(function* () {
			// Access HttpClient
			const client = yield* HttpClient.HttpClient;

			const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(pass)));
			const hashPrefix = hash.slice(0, 5);

			const response = yield* client
				.get(`https://api.pwnedpasswords.com/range/${hashPrefix}`)
				.pipe(
					Effect.catchAll((error) => Effect.succeed({ text: Effect.succeed(''), status: 500 }))
				);

			// If the API is unavailable, skip the check rather than failing
			if (response.status >= 400) {
				return;
			}

			const data = yield* response.text;
			const lines = data.split('\n');

			for (const line of lines) {
				const hashSuffix = line.slice(0, 35).toLowerCase();
				if (hash === hashPrefix + hashSuffix) {
					return 'Password must not be in the <a href="https://haveibeenpwned.com/Passwords" target="_blank">pwned password database</a>.';
				}
			}

			return;
		}).pipe(Effect.provide(FetchHttpClient.layer));

	/**
	 * Verifies the strength of a given password.
	 *
	 * The password must meet the following criteria:
	 * - Be between 6 and 255 characters in length.
	 * - Not be a known unsafe password.
	 * - Not be found in the pwned password database.
	 *
	 * @param password - The password to verify.
	 * @returns A promise that resolves to `true` if the password is strong/secure enough, otherwise `false`.
	 */
	const verifyPasswordStrength = (password: string) =>
		Effect.gen(function* () {
			// Password must be between 6 ~ 255 characters
			const lengthCheck = yield* verifyPasswordLength(password);
			if (lengthCheck) {
				return lengthCheck;
			}

			// Check if password is known unsafe password
			const unsafeCheck = yield* verifySafe(password);
			if (unsafeCheck) {
				return unsafeCheck;
			}

			// Check if password is in pwned password database
			const pwnedCheck = yield* checkPwnedDB(password);
			if (pwnedCheck) {
				return pwnedCheck;
			}

			return true;
		});

	return {
		hashPassword,
		verifyPasswordHash,
		verifyPasswordStrength,
	};
});

/**
 * Represents a `Password` class that extends an `Effect.Tag` with specific types.
 * This class is used to manage password-related functionality within the application.
 *
 * - The `Effect.Tag` is parameterized with:
 *   - A unique identifier string for the tag: `'studiocms/lib/auth/password/Password'`.
 *   - The success type of the `Effect` created by the `make` function.
 *
 * Static Members:
 * - `Live`: An instance of the `Effect` created by the `make` function, provided with the default `Scrypt` implementation.
 * - `Layer`: A scoped layer that provides the `Password` instance using the `Live` effect.
 */
export class Password extends Effect.Tag('studiocms/lib/auth/password/Password')<
	Password,
	Effect.Effect.Success<typeof make>
>() {
	static Live = make;
	static Layer = Layer.scoped(this, this.Live);
}

/**
 * Hashes a plain text password using script.
 *
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string, _salt?: string): Promise<string> {
	const program = Effect.gen(function* () {
		const pass = yield* Password;
		return yield* pass.hashPassword(password, _salt);
	}).pipe(Effect.provide(Password.Layer));

	return await Effect.runPromise(program);
}

/**
 * Verifies if the provided password matches the hashed password.
 *
 * @param hash - The hashed password to compare against.
 * @param password - The plain text password to verify.
 * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
 */
export async function verifyPasswordHash(hash: string, password: string): Promise<boolean> {
	const program = Effect.gen(function* () {
		const pass = yield* Password;
		return yield* pass.verifyPasswordHash(hash, password);
	}).pipe(Effect.provide(Password.Layer));

	return await Effect.runPromise(program);
}

/**
 * Verifies the strength of a given password.
 *
 * The password must meet the following criteria:
 * - Be between 6 and 255 characters in length.
 * - Not be a known unsafe password.
 * - Not be found in the pwned password database.
 *
 * @param password - The password to verify.
 * @returns A promise that resolves to `true` if the password is strong/secure enough, otherwise `false`.
 */
export async function verifyPasswordStrength(password: string): Promise<true | string> {
	const program = Effect.gen(function* () {
		const pass = yield* Password;
		return yield* pass.verifyPasswordStrength(password);
	}).pipe(Effect.provide(Password.Layer));

	return await Effect.runPromise(program);
}
