import { createCipheriv, createDecipheriv } from 'node:crypto';
import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
import { DynamicBuffer } from '@oslojs/binary';
import { decodeBase64 } from '@oslojs/encoding';
import { Effect } from 'effect';
import { genLogger, pipeLogger } from '../effects/index.js';

/**
 * The `Encryption` class provides methods for encrypting and decrypting data using AES-128-GCM encryption.
 * It includes utilities for handling encryption keys, encrypting/decrypting data as `Uint8Array`, and converting
 * encrypted/decrypted data to and from strings.
 *
 * ### Methods:
 * - `getKey`: Retrieves the encryption key from the environment variable `CMS_ENCRYPTION_KEY`.
 * - `encrypt`: Encrypts a `Uint8Array` using AES-128-GCM and returns the encrypted data.
 * - `encryptToString`: Encrypts a string and returns the encrypted data as a `Uint8Array`.
 * - `decrypt`: Decrypts a `Uint8Array` encrypted with AES-128-GCM and returns the decrypted data.
 * - `decryptToString`: Decrypts a `Uint8Array` and returns the decrypted data as a string.
 *
 * ### Encryption Details:
 * - The encryption algorithm used is `aes-128-gcm`.
 * - The encrypted data includes the initialization vector (IV), the encrypted content, and the authentication tag.
 * - The IV is randomly generated for each encryption operation.
 *
 * ### Error Handling:
 * - The `decrypt` method throws an error if the encrypted data is less than 33 bytes.
 *
 * ### Dependencies:
 * - `Effect`: A utility for managing asynchronous effects.
 * - `pipeLogger` and `genLogger`: Logging utilities for tracing method calls.
 * - `DynamicBuffer`: A utility for dynamically managing byte buffers.
 * - `crypto`: Used for generating random values and creating cipher/decipher instances.
 */
export class Encryption extends Effect.Service<Encryption>()(
	'studiocms/lib/auth/encryption/Encryption',
	{
		effect: genLogger('studiocms/lib/auth/encryption/Encryption.effect')(function* () {
			const getKey = pipeLogger('studiocms/lib/auth/encryption/Encryption.getKey')(
				Effect.try(() => decodeBase64(CMS_ENCRYPTION_KEY))
			);
			const _key = yield* getKey;

			const _algorithm = 'aes-128-gcm';

			/**
			 * Encrypts the given data using AES-128-GCM encryption.
			 *
			 * @param data - The data to be encrypted as a Uint8Array.
			 * @returns The encrypted data as a Uint8Array, which includes the initialization vector (IV),
			 *          the encrypted content, and the authentication tag.
			 */
			const encrypt = (data: Uint8Array) =>
				pipeLogger('studiocms/lib/auth/encryption/Encryption.encrypt')(
					Effect.try(() => {
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
			const encryptToString = (data: string) =>
				genLogger('studiocms/lib/auth/encryption/Encryption.encryptToString')(function* () {
					const encodedData = yield* Effect.try(() => new TextEncoder().encode(data));
					return yield* encrypt(encodedData);
				});

			/**
			 * Decrypts the given encrypted data using AES-128-GCM.
			 *
			 * @param encrypted - The encrypted data as a Uint8Array. The data must be at least 33 bytes long.
			 * @returns The decrypted data as a Uint8Array.
			 * @throws Will throw an error if the encrypted data is less than 33 bytes.
			 */
			const decrypt = (data: Uint8Array) =>
				pipeLogger('studiocms/lib/auth/encryption/Encryption.decrypt')(
					Effect.try(() => {
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
			const decryptToString = (data: Uint8Array) =>
				genLogger('studiocms/lib/auth/encryption/Encryption.decryptToString')(function* () {
					const decrypted = yield* decrypt(data);
					return yield* Effect.try(() => new TextDecoder().decode(decrypted));
				});

			return {
				getKey,
				encrypt,
				encryptToString,
				decrypt,
				decryptToString,
			};
		}),
	}
) {}

/**
 * Encrypts the given data using AES-128-GCM encryption.
 *
 * @param data - The data to be encrypted as a Uint8Array.
 * @returns The encrypted data as a Uint8Array, which includes the initialization vector (IV),
 *          the encrypted content, and the authentication tag.
 */
export function encrypt(data: Uint8Array): Uint8Array {
	const program = Effect.gen(function* () {
		const encrypt = yield* Encryption;
		return yield* encrypt.encrypt(data);
	}).pipe(Effect.provide(Encryption.Default));

	return Effect.runSync(program);
}

/**
 * Encrypts a given string and returns the encrypted data as a Uint8Array.
 *
 * @param data - The string to be encrypted.
 * @returns The encrypted data as a Uint8Array.
 */
export function encryptString(data: string): Uint8Array {
	const program = Effect.gen(function* () {
		const encrypt = yield* Encryption;
		return yield* encrypt.encryptToString(data);
	}).pipe(Effect.provide(Encryption.Default));

	return Effect.runSync(program);
}

/**
 * Decrypts the given encrypted data using AES-128-GCM.
 *
 * @param encrypted - The encrypted data as a Uint8Array. The data must be at least 33 bytes long.
 * @returns The decrypted data as a Uint8Array.
 * @throws Will throw an error if the encrypted data is less than 33 bytes.
 */
export function decrypt(data: Uint8Array): Uint8Array {
	const program = Effect.gen(function* () {
		const encrypt = yield* Encryption;
		return yield* encrypt.decrypt(data);
	}).pipe(Effect.provide(Encryption.Default));

	return Effect.runSync(program);
}

/**
 * Decrypts the given Uint8Array data and returns the result as a string.
 *
 * @param data - The encrypted data as a Uint8Array.
 * @returns The decrypted data as a string.
 */
export function decryptToString(data: Uint8Array): string {
	const program = Effect.gen(function* () {
		const encrypt = yield* Encryption;
		return yield* encrypt.decryptToString(data);
	}).pipe(Effect.provide(Encryption.Default));

	return Effect.runSync(program);
}
