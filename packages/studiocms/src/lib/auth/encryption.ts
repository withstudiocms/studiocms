import { createCipheriv, createDecipheriv } from 'node:crypto';
import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
import { DynamicBuffer } from '@oslojs/binary';
import { decodeBase64 } from '@oslojs/encoding';
import { Effect, Layer } from 'effect';

export const make = Effect.gen(function* () {
	const getKey = Effect.try(() => decodeBase64(CMS_ENCRYPTION_KEY));
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
		});

	/**
	 * Encrypts a given string and returns the encrypted data as a Uint8Array.
	 *
	 * @param data - The string to be encrypted.
	 * @returns The encrypted data as a Uint8Array.
	 */
	const encryptToString = (data: string) =>
		Effect.gen(function* () {
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
		});

	/**
	 * Decrypts the given Uint8Array data and returns the result as a string.
	 *
	 * @param data - The encrypted data as a Uint8Array.
	 * @returns The decrypted data as a string.
	 */
	const decryptToString = (data: Uint8Array) =>
		Effect.gen(function* () {
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
});

/**
 * Provides encryption and decryption utilities using AES-128-GCM algorithm.
 *
 * This module includes methods for encrypting and decrypting data, both as raw
 * `Uint8Array` and as strings. It also provides a method to retrieve the encryption key.
 *
 * @returns An object containing the following methods:
 *
 * - `getKey`: Retrieves the encryption key as a `Uint8Array`.
 * - `encrypt`: Encrypts a `Uint8Array` using AES-128-GCM and returns the encrypted data.
 * - `encryptToString`: Encrypts a string using AES-128-GCM and returns the encrypted data as a `Uint8Array`.
 * - `decrypt`: Decrypts an encrypted `Uint8Array` using AES-128-GCM and returns the decrypted data.
 * - `decryptToString`: Decrypts an encrypted `Uint8Array` using AES-128-GCM and returns the decrypted data as a string.
 *
 * @throws Will throw an error if the encryption key is invalid or if decryption fails due to invalid data.
 */
export class Encryption extends Effect.Tag('studiocms/lib/auth/encryption/Encryption')<
	Encryption,
	Effect.Effect.Success<typeof make>
>() {
	static Live = make;
	static Layer = Layer.scoped(this, this.Live);
}

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
	}).pipe(Effect.provide(Encryption.Layer));

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
	}).pipe(Effect.provide(Encryption.Layer));

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
	}).pipe(Effect.provide(Encryption.Layer));

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
	}).pipe(Effect.provide(Encryption.Layer));

	return Effect.runSync(program);
}
