import { createCipheriv, createDecipheriv } from 'node:crypto';
import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
import { DynamicBuffer } from '@oslojs/binary';
import { decodeBase64 } from '@oslojs/encoding';

const key = decodeBase64(CMS_ENCRYPTION_KEY);

/**
 * Encrypts the given data using AES-128-GCM encryption.
 *
 * @param data - The data to be encrypted as a Uint8Array.
 * @returns The encrypted data as a Uint8Array, which includes the initialization vector (IV),
 *          the encrypted content, and the authentication tag.
 */
export function encrypt(data: Uint8Array): Uint8Array {
	const iv = new Uint8Array(16);
	crypto.getRandomValues(iv);
	const cipher = createCipheriv('aes-128-gcm', key, iv);
	const encrypted = new DynamicBuffer(0);
	encrypted.write(iv);
	encrypted.write(cipher.update(data));
	encrypted.write(cipher.final());
	encrypted.write(cipher.getAuthTag());
	return encrypted.bytes();
}

/**
 * Encrypts a given string and returns the encrypted data as a Uint8Array.
 *
 * @param data - The string to be encrypted.
 * @returns The encrypted data as a Uint8Array.
 */
export function encryptString(data: string): Uint8Array {
	return encrypt(new TextEncoder().encode(data));
}

/**
 * Decrypts the given encrypted data using AES-128-GCM.
 *
 * @param encrypted - The encrypted data as a Uint8Array. The data must be at least 33 bytes long.
 * @returns The decrypted data as a Uint8Array.
 * @throws Will throw an error if the encrypted data is less than 33 bytes.
 */
export function decrypt(encrypted: Uint8Array): Uint8Array {
	if (encrypted.byteLength < 33) {
		throw new Error('Invalid data');
	}
	const decipher = createDecipheriv('aes-128-gcm', key, encrypted.slice(0, 16));
	decipher.setAuthTag(encrypted.slice(encrypted.byteLength - 16));
	const decrypted = new DynamicBuffer(0);
	decrypted.write(decipher.update(encrypted.slice(16, encrypted.byteLength - 16)));
	decrypted.write(decipher.final());
	return decrypted.bytes();
}

/**
 * Decrypts the given Uint8Array data and returns the result as a string.
 *
 * @param data - The encrypted data as a Uint8Array.
 * @returns The decrypted data as a string.
 */
export function decryptToString(data: Uint8Array): string {
	return new TextDecoder().decode(decrypt(data));
}
