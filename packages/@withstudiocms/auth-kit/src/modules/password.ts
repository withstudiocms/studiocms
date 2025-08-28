import { randomBytes } from 'node:crypto';
import { Effect } from '@withstudiocms/effect';
import type { IScrypt } from '../types.js';
import {
	breakSecurePassword,
	buildSecurePassword,
	checkPwnedDB,
	constantTimeEqual,
	PASS_GEN1_0_PREFIX,
	verifyPasswordLength,
	verifySafe,
} from '../utils/password.js';

/**
 * Password management utilities
 */
export const Password = (Scrypt: IScrypt) =>
	Effect.gen(function* () {
		const scrypt = yield* Scrypt;

		/**
		 * Hashes a plain text password using script.
		 *
		 * @param password - The plain text password to hash.
		 * @returns A promise that resolves to the hashed password.
		 */
		const hashPassword = Effect.fn('@withstudiocms/AuthKit/modules/password.hashPassword')(
			function* (password: string, _salt?: string) {
				const salt = _salt || randomBytes(16).toString('hex');
				const hash = yield* scrypt.run(password + salt);
				return yield* buildSecurePassword({
					generation: PASS_GEN1_0_PREFIX,
					salt,
					hash: hash.toString('hex'),
				});
			}
		);

		/**
		 * Verifies if the provided password matches the hashed password.
		 *
		 * @param hash - The hashed password to compare against.
		 * @param password - The plain text password to verify.
		 * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
		 */
		const verifyPasswordHash = Effect.fn(
			'@withstudiocms/AuthKit/modules/password.verifyPasswordHash'
		)(function* (hash: string, password: string) {
			const { salt } = yield* breakSecurePassword(hash);
			const newHash = yield* hashPassword(password, salt);
			return constantTimeEqual(hash, newHash);
		});

		/**
		 * Verifies the strength of a given password.
		 *
		 * The password must meet the following criteria:
		 * - Be between 6 and 255 characters in length.
		 * - Not be a known unsafe password.
		 * - Not be found in the pwned password database.
		 *
		 * @param pass - The password to verify.
		 * @returns A promise that resolves to `true` if the password is strong/secure enough, otherwise `false`.
		 */
		const verifyPasswordStrength = Effect.fn(
			'@withstudiocms/AuthKit/modules/password.verifyPasswordStrength'
		)(function* (pass: string) {
			// Password must be between 6 ~ 255 characters
			const lengthCheck = yield* verifyPasswordLength(pass);
			if (lengthCheck) return lengthCheck;

			// Check if password is known unsafe password
			const unsafeCheck = yield* verifySafe(pass);
			if (unsafeCheck) return unsafeCheck;

			// Check if password is in pwned password database
			const pwnedCheck = yield* checkPwnedDB(pass);
			if (pwnedCheck) return pwnedCheck;

			return true;
		});

		return {
			hashPassword,
			verifyPasswordHash,
			verifyPasswordStrength,
		} as const;
	});
