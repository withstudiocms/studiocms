import { sha1 } from '@oslojs/crypto/sha1';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { Effect, Platform } from '@withstudiocms/effect';
import { PasswordError, usePasswordError } from '../errors.js';
import { CheckIfUnsafe } from './unsafeCheck.js';

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
export const constantTimeEqual = (a: string, b: string): boolean => {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return result === 0;
};

/**
 * The generation prefix for the secure password format.
 * This is used to identify the version of the password hashing scheme.
 */
export const PASS_GEN1_0_PREFIX = 'gen1.0';

/**
 * Builds a secure password hash from the generation, salt, and hash.
 *
 * The format of the secure password is: `gen1.0:salt:hash`.
 * If any of the components are invalid, a PasswordError is thrown.
 *
 * @param generation - The generation identifier (e.g., 'gen1.0').
 * @param salt - The salt used in the hashing process.
 * @param hash - The hashed password.
 * @returns A string representing the secure password.
 */
export const buildSecurePassword = Effect.fn(
	({ generation, hash, salt }: { generation: string; salt: string; hash: string }) =>
		Effect.succeed(`${generation}:${salt}:${hash}`)
);

/**
 * Breaks down a secure password hash into its components.
 *
 * The hash is expected to be in the format: `gen1.0:salt:hash`.
 * If the hash does not match this format, or if it uses an unsupported generation,
 * a PasswordError is thrown.
 *
 * @param hash - The secure password hash to break down.
 * @returns An object containing the generation, salt, and hash value.
 */
export const breakSecurePassword = Effect.fn((hash: string) =>
	usePasswordError(() => {
		const parts = hash.split(':');
		if (parts.length !== 3) {
			throw new PasswordError({
				message: 'Invalid secure password format. Expected "gen1.0:salt:hash".',
			});
		}
		const [generation, salt, hashValue] = parts;
		if (generation !== PASS_GEN1_0_PREFIX) {
			throw new PasswordError({
				message: 'Legacy password hashes are not supported. Please reset any legacy passwords.',
			});
		}
		if (!salt || !hashValue) {
			throw new PasswordError({
				message: 'Invalid secure password format: missing salt or hash.',
			});
		}
		return { generation, salt, hash: hashValue };
	})
);

/**
 * @private Internal function for the `verifyPasswordStrength` function
 */
export const verifyPasswordLength = Effect.fn((pass: string) =>
	usePasswordError(() => {
		if (pass.length < 6 || pass.length > 255) {
			return 'Password must be between 6 and 255 characters long.';
		}
		return undefined;
	})
);

/**
 * @private Internal function for the `verifyPasswordStrength` function
 */
export const verifySafe = (pass: string) =>
	Effect.gen(function* () {
		const check = yield* CheckIfUnsafe;
		const isUnsafe = yield* check.password(pass);
		if (isUnsafe) {
			return 'Password must not be a commonly known unsafe password (admin, root, etc.)' as string;
		}
		return undefined;
	}).pipe(Effect.provide(CheckIfUnsafe.Default));

/**
 * @private Internal function for the `verifyPasswordStrength` function
 */
export const checkPwnedDB = (pass: string) =>
	Effect.gen(function* () {
		const http = yield* Platform.HttpClient.HttpClient;
		const encodedData = new TextEncoder().encode(pass);
		const sha1Hash = sha1(encodedData);
		const hashHex = encodeHexLowerCase(sha1Hash);
		const hashPrefix = hashHex.slice(0, 5);

		const response = yield* http.get(`https://api.pwnedpasswords.com/range/${hashPrefix}`).pipe(
			Effect.catchTags({
				RequestError: () => Effect.succeed({ text: Effect.succeed(''), status: 500 }),
				ResponseError: () => Effect.succeed({ text: Effect.succeed(''), status: 500 }),
			})
		);

		// If the API is unavailable, skip the check rather than failing
		if (response.status >= 400) {
			return undefined;
		}

		const data = yield* response.text;
		const lines = data.split('\n');

		for (const line of lines) {
			const hashSuffix = line.slice(0, 35).toLowerCase();
			if (hashHex === hashPrefix + hashSuffix) {
				return 'Password must not be in the <a href="https://haveibeenpwned.com/Passwords" target="_blank">pwned password database</a>.' as string;
			}
		}

		return undefined;
	}).pipe(Effect.provide(Platform.FetchHttpClient.layer));
