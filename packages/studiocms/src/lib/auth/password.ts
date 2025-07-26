import crypto from 'node:crypto';
import { FetchHttpClient, HttpClient } from '@effect/platform';
import { sha1 } from '@oslojs/crypto/sha1';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { Data, Effect } from 'effect';
import { genLogger, pipeLogger } from '../effects/index.js';
import { Scrypt } from './utils/scrypt.js';
import { CheckIfUnsafe, type CheckIfUnsafeError } from './utils/unsafeCheck.js';

export class PasswordError extends Data.TaggedError('PasswordError')<{ message: string }> {}

/**
 * The `Password` class provides methods for hashing passwords, verifying password hashes,
 * and checking the strength of passwords. It includes functionality for ensuring passwords
 * meet security standards, such as length requirements, avoiding unsafe passwords, and
 * checking against the pwned password database.
 *
 * ### Methods:
 * - `hashPassword`: Hashes a plain text password using a secure algorithm.
 * - `verifyPasswordHash`: Verifies if a plain text password matches a hashed password.
 * - `verifyPasswordStrength`: Checks if a password meets strength requirements, including
 *   length, safety, and absence from the pwned password database.
 *
 * ### Dependencies:
 * - `Scrypt`: Used for password hashing.
 * - `CheckIfUnsafe`: Used to check if a password is a commonly known unsafe password.
 * - `FetchHttpClient`: Used for making HTTP requests to external services, such as the
 *   pwned password database API.
 *
 * ### Notes:
 * - The `legacy0HashPassword` function is marked as deprecated and should not be used in
 *   new implementations.
 * - The `constantTimeEqual` function ensures secure string comparison to prevent timing
 *   attacks.
 */
export class Password extends Effect.Service<Password>()('studiocms/lib/auth/password/Password', {
	effect: genLogger('studiocms/lib/auth/password/Password.effect')(function* () {
		const scrypt = yield* Scrypt;
		const check = yield* CheckIfUnsafe;
		const client = yield* HttpClient.HttpClient;

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
			genLogger('studiocms/lib/auth/password/Password.hashPassword')(function* () {
				const salt = _salt || crypto.randomBytes(16).toString('hex');
				const hashed = yield* scrypt.run(password + salt);
				return `gen1.0:${salt}:${hashed.toString('hex')}`;
			});

		/**
		 * Verifies if the provided password matches the hashed password.
		 *
		 * @param hash - The hashed password to compare against.
		 * @param password - The plain text password to verify.
		 * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
		 */
		const verifyPasswordHash = (hash: string, password: string) =>
			genLogger('studiocms/lib/auth/password/Password.verifyPasswordHash')(function* () {
				if (!hash.startsWith('gen1.0:')) {
					// If the hash does not start with 'gen1.0:', it is considered legacy and should not be used.
					return false;
				}
				const [_prefix, salt] = hash.split(':', 3);
				const newHash = yield* hashPassword(password, salt);
				return constantTimeEqual(hash, newHash);
			});

		/**
		 * @private Internal function for the `verifyPasswordStrength` function
		 */
		const verifyPasswordLength = (
			pass: string
		): Effect.Effect<string | undefined, PasswordError, never> =>
			pipeLogger('studiocms/lib/auth/password/Password.verifyPasswordLength')(
				Effect.try({
					try: () => {
						if (pass.length < 6 || pass.length > 255) {
							return 'Password must be between 6 and 255 characters long.';
						}
						return undefined;
					},
					catch: (cause) =>
						new PasswordError({
							message: `An unknown Error occurred when checking the password length: ${cause}`,
						}),
				})
			);

		/**
		 * @private Internal function for the `verifyPasswordStrength` function
		 */
		const verifySafe = (
			pass: string
		): Effect.Effect<string | undefined, CheckIfUnsafeError, never> =>
			genLogger('studiocms/lib/auth/password/Password.verifySafe')(function* () {
				const isUnsafe = yield* check.password(pass);
				if (isUnsafe) {
					return 'Password must not be a commonly known unsafe password (admin, root, etc.)';
				}
				return undefined;
			});

		/**
		 * @private Internal function for the `verifyPasswordStrength` function
		 */
		const checkPwnedDB = (pass: string) =>
			genLogger('studiocms/lib/auth/password/Password.checkPwnedDB')(function* () {
				const encodedData = new TextEncoder().encode(pass);
				const sha1Hash = sha1(encodedData);
				const hashHex = encodeHexLowerCase(sha1Hash);
				const hashPrefix = hashHex.slice(0, 5);

				const response = yield* client
					.get(`https://api.pwnedpasswords.com/range/${hashPrefix}`)
					.pipe(
						Effect.catchTags({
							RequestError: () => Effect.succeed({ text: Effect.succeed(''), status: 500 }),
							ResponseError: () => Effect.succeed({ text: Effect.succeed(''), status: 500 }),
						})
					);

				// If the API is unavailable, skip the check rather than failing
				if (response.status >= 400) {
					return;
				}

				const data = yield* response.text;
				const lines = data.split('\n');

				for (const line of lines) {
					const hashSuffix = line.slice(0, 35).toLowerCase();
					if (hashHex === hashPrefix + hashSuffix) {
						return 'Password must not be in the <a href="https://haveibeenpwned.com/Passwords" target="_blank">pwned password database</a>.';
					}
				}

				return;
			});

		/**
		 * Verifies the strength of a given password.
		 *
		 * The password must meet the following criteria:
		 * - Be between 8 and 255 characters in length.
		 * - Not be a known unsafe password.
		 * - Not be found in the pwned password database.
		 *
		 * @param password - The password to verify.
		 * @returns A promise that resolves to `true` if the password is strong/secure enough, otherwise `false`.
		 */
		const verifyPasswordStrength = (password: string) =>
			genLogger('studiocms/lib/auth/password/Password.verifyPasswordStrength')(function* () {
				// Password must be between 8 ~ 255 characters
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
	}),
	dependencies: [Scrypt.Default, CheckIfUnsafe.Default, FetchHttpClient.layer],
}) {
	static Provide = Effect.provide(this.Default);
}
