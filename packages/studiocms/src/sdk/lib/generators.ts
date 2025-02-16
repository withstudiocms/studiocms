import { cmsEncryptionKey } from 'virtual:studiocms/sdk/env';
import jwt from 'jsonwebtoken';
/**
 * Generates a random ID number with the specified length.
 *
 * @param length - The length of the random ID number to generate.
 * @returns A random ID number with the specified length.
 */
export function generateRandomIDNumber(length: number): number {
	return Math.floor(Math.random() * 10 ** length);
}

export function generateToken(userId: string): string {
	return jwt.sign({ userId }, cmsEncryptionKey, { expiresIn: '3h' });
}

export function testToken(token: string) {
	return jwt.verify(token, cmsEncryptionKey);
}

export function generateRandomPassword(length: number): string {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let password = '';
	for (let i = 0; i < length; i++) {
		password += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return password;
}
