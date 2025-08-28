import { createCipheriv, createDecipheriv } from 'node:crypto';
import { DynamicBuffer } from '@oslojs/binary';
import { decodeBase64 } from '@oslojs/encoding';
import { Effect } from '@withstudiocms/effect';
import { useDecryptionError, useEncryptionError } from '../errors.js';

/**
 * Encryption utilities
 */
export const Encryption = (CMS_ENCRYPTION_KEY: string) =>
	Effect.fn('@withstudiocms/AuthKit/modules/encryption')(function* () {
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
		const encrypt = Effect.fn('@withstudiocms/AuthKit/modules/encryption.encrypt')(
			(data: Uint8Array) =>
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
		const encryptToString = Effect.fn('@withstudiocms/AuthKit/modules/encryption.encryptToString')(
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
		const decrypt = Effect.fn('@withstudiocms/AuthKit/modules/encryption.decrypt')(
			(data: Uint8Array) =>
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
		const decryptToString = Effect.fn('@withstudiocms/AuthKit/modules/encryption.decryptToString')(
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
