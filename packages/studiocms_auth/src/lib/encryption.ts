import { createCipheriv, createDecipheriv } from 'node:crypto';
import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
import { DynamicBuffer } from '@oslojs/binary';
import { decodeBase64 } from '@oslojs/encoding';

const key = decodeBase64(CMS_ENCRYPTION_KEY);

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

export function encryptString(data: string): Uint8Array {
	return encrypt(new TextEncoder().encode(data));
}

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

export function decryptToString(data: Uint8Array): string {
	return new TextDecoder().decode(decrypt(data));
}
