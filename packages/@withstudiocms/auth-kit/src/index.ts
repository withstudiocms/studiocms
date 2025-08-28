import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { DynamicBuffer } from '@oslojs/binary';
import { decodeBase64 } from '@oslojs/encoding';
import { Effect } from '@withstudiocms/effect';
import { Scrypt as _Scrypt } from '@withstudiocms/effect/scrypt';
import { AuthKitOptions, type RawAuthKitConfig } from './config.js';
import { useDecryptionError, useEncryptionError } from './errors.js';
import {
	breakSecurePassword,
	buildSecurePassword,
	checkPwnedDB,
	constantTimeEqual,
	PASS_GEN1_0_PREFIX,
	verifyPasswordLength,
	verifySafe,
} from './utils/index.js';

export class AuthKit extends Effect.Service<AuthKit>()('@withstudiocms/AuthKit', {
	effect: Effect.gen(function* () {
		const { CMS_ENCRYPTION_KEY, scrypt } = yield* AuthKitOptions;

		/**
		 * Scrypt Effect processor
		 * @private
		 */
		const Scrypt = Effect.gen(function* () {
			const { run } = yield* _Scrypt;
			return { run };
		}).pipe(Effect.provide(_Scrypt.makeLive(scrypt)));

		/**
		 * Encryption utilities
		 */
		const Encryption = Effect.fn('@withstudiocms/AuthKit.Encryption')(function* () {
			/**
			 * Get the encryption key
			 * @private
			 */
			const getKey = useEncryptionError(() => decodeBase64(CMS_ENCRYPTION_KEY));

			/**
			 * The encryption key
			 * @private
			 */
			const _key = yield* getKey;

			/**
			 * The encryption algorithm
			 * @private
			 */
			const _algorithm = 'aes-128-gcm';

			/**
			 * Encrypts the given data using AES-128-GCM encryption.
			 *
			 * @param data - The data to be encrypted as a Uint8Array.
			 * @returns The encrypted data as a Uint8Array, which includes the initialization vector (IV),
			 *          the encrypted content, and the authentication tag.
			 */
			const encrypt = Effect.fn('@withstudiocms/AuthKit.Encryption.encrypt')((data: Uint8Array) =>
				useEncryptionError(() => {
					const iv = new Uint8Array(16);
					crypto.getRandomValues(iv);
					const cipher = createCipheriv(_algorithm, _key, iv);
					const encrypted = new DynamicBuffer(0);
					encrypted.write(iv);
					encrypted.write(cipher.update(data));
					encrypted.write(cipher.final());
					encrypted.write(cipher.getAuthTag());
					return encrypted.bytes();
				})
			);

			/**
			 * Encrypts a given string and returns the encrypted data as a Uint8Array.
			 *
			 * @param data - The string to be encrypted.
			 * @returns The encrypted data as a Uint8Array.
			 */
			const encryptToString = Effect.fn('@withstudiocms/AuthKit.Encryption.encryptToString')(
				function* (data: string) {
					const encoded = yield* useEncryptionError(() => new TextEncoder().encode(data));
					return yield* encrypt(encoded);
				}
			);

			/**
			 * Decrypts the given encrypted data using AES-128-GCM.
			 *
			 * @param encrypted - The encrypted data as a Uint8Array. The data must be at least 33 bytes long.
			 * @returns The decrypted data as a Uint8Array.
			 * @throws Will throw an error if the encrypted data is less than 33 bytes.
			 */
			const decrypt = Effect.fn('@withstudiocms/AuthKit.Encryption.decrypt')((data: Uint8Array) =>
				useDecryptionError(() => {
					if (data.byteLength < 33) {
						throw new Error('Invalid data');
					}
					const decipher = createDecipheriv(_algorithm, _key, data.slice(0, 16));
					decipher.setAuthTag(data.slice(data.byteLength - 16));
					const decrypted = new DynamicBuffer(0);
					decrypted.write(decipher.update(data.slice(16, data.byteLength - 16)));
					decrypted.write(decipher.final());
					return decrypted.bytes();
				})
			);

			/**
			 * Decrypts the given Uint8Array data and returns the result as a string.
			 *
			 * @param data - The encrypted data as a Uint8Array.
			 * @returns The decrypted data as a string.
			 */
			const decryptToString = Effect.fn('@withstudiocms/AuthKit.Encryption.decryptToString')(
				function* (data: Uint8Array) {
					const decoded = yield* decrypt(data);
					return yield* useDecryptionError(() => new TextDecoder().decode(decoded));
				}
			);

			return {
				encrypt,
				encryptToString,
				decrypt,
				decryptToString,
			} as const;
		});

		/**
		 * Password management utilities
		 */
		const Password = Effect.fn('@withstudiocms/AuthKit.Password')(function* () {
			const scrypt = yield* Scrypt;

			/**
			 * Hashes a plain text password using script.
			 *
			 * @param password - The plain text password to hash.
			 * @returns A promise that resolves to the hashed password.
			 */
			const hashPassword = Effect.fn('@withstudiocms/AuthKit.Password.hashPassword')(function* (
				password: string,
				_salt?: string
			) {
				const salt = _salt || randomBytes(16).toString('hex');
				const hash = yield* scrypt.run(password + salt);
				return yield* buildSecurePassword({
					generation: PASS_GEN1_0_PREFIX,
					salt,
					hash: hash.toString('hex'),
				});
			});

			/**
			 * Verifies if the provided password matches the hashed password.
			 *
			 * @param hash - The hashed password to compare against.
			 * @param password - The plain text password to verify.
			 * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
			 */
			const verifyPasswordHash = Effect.fn('@withstudiocms/AuthKit.Password.verifyPasswordHash')(
				function* (hash: string, password: string) {
					const { salt } = yield* breakSecurePassword(hash);
					const newHash = yield* hashPassword(password, salt);
					return constantTimeEqual(hash, newHash);
				}
			);

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
				'@withstudiocms/AuthKit.Password.verifyPasswordStrength'
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

		return {
			Encryption,
			Password,
		} as const;
	}),
}) {
	static makeConfig = (config: RawAuthKitConfig) => AuthKitOptions.Live(config);
}
