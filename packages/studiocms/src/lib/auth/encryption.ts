import { createCipheriv, createDecipheriv } from 'node:crypto';
import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
import { DynamicBuffer } from '@oslojs/binary';
import { decodeBase64 } from '@oslojs/encoding';
import { Data, Effect } from 'effect';
import { genLogger, pipeLogger } from '../effects/index.js';

export class EncryptionError extends Data.TaggedError('EncryptionError')<{
	message: string;
}> {}

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
				Effect.try({
					try: () => decodeBase64(CMS_ENCRYPTION_KEY),
					catch: (cause) =>
						new EncryptionError({
							message: `An Error occurred while getting the encryption key: ${cause}`,
						}),
				})
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
					Effect.try({
						try: () => {
							const iv = new Uint8Array(16);
							crypto.getRandomValues(iv);
							const cipher = createCipheriv(_algorithm, _key, iv);
							const encrypted = new DynamicBuffer(0);
							encrypted.write(iv);
							encrypted.write(cipher.update(data));
							encrypted.write(cipher.final());
							encrypted.write(cipher.getAuthTag());
							return encrypted.bytes();
						},
						catch: (cause) =>
							new EncryptionError({ message: `An error occurred when encrypting data: ${cause}` }),
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
					const encodedData = yield* Effect.try({
						try: () => new TextEncoder().encode(data),
						catch: (cause) =>
							new EncryptionError({ message: `An error occurred when encrypting data: ${cause}` }),
					});
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
					Effect.try({
						try: () => {
							if (data.byteLength < 33) {
								throw new Error('Invalid data');
							}
							const decipher = createDecipheriv(_algorithm, _key, data.slice(0, 16));
							decipher.setAuthTag(data.slice(data.byteLength - 16));
							const decrypted = new DynamicBuffer(0);
							decrypted.write(decipher.update(data.slice(16, data.byteLength - 16)));
							decrypted.write(decipher.final());
							return decrypted.bytes();
						},
						catch: (cause) =>
							new EncryptionError({ message: `An error occurred when decrypting data: ${cause}` }),
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
					return yield* Effect.try({
						try: () => new TextDecoder().decode(decrypted),
						catch: (cause) =>
							new EncryptionError({ message: `An error occurred when decrypting data: ${cause}` }),
					});
				});

			return {
				encrypt,
				encryptToString,
				decrypt,
				decryptToString,
			};
		}),
	}
) {
	static Provide = Effect.provide(this.Default);
}

/**
 * Encrypts the given data using AES-128-GCM encryption.
 *
 * @param data - The data to be encrypted as a Uint8Array.
 * @returns The encrypted data as a Uint8Array, which includes the initialization vector (IV),
 *          the encrypted content, and the authentication tag.
 * @deprecated use the Effect instead
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
 * @deprecated use the Effect instead
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
 * @deprecated use the Effect instead
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
 * @deprecated use the Effect instead
 */
export function decryptToString(data: Uint8Array): string {
	const program = Effect.gen(function* () {
		const encrypt = yield* Encryption;
		return yield* encrypt.decryptToString(data);
	}).pipe(Effect.provide(Encryption.Default));

	return Effect.runSync(program);
}
