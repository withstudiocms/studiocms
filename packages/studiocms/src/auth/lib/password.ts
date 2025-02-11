import { scrypt as nodeScrypt } from 'node:crypto';
// @ts-ignore
import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
// import { checkIfUnsafe } from '@matthiesenxyz/integration-utils/securityUtils';
import { sha1 } from '@oslojs/crypto/sha1';
import { encodeHexLowerCase } from '@oslojs/encoding';

type RemoveLast<T extends unknown[]> = T extends [...infer Rest, infer _Last] ? Rest : never;

function scrypt(...opts: RemoveLast<Parameters<typeof nodeScrypt>>): Promise<Buffer> {
	return new Promise((res, rej) => {
		nodeScrypt(...opts, (err, derivedKey) => {
			if (err) rej(err);
			else res(derivedKey);
		});
	});
}

/**
 * Hashes a plain text password using bcrypt.
 *
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
	const hashedPassword = await scrypt(password, CMS_ENCRYPTION_KEY, 64, {});
	return hashedPassword.toString();
}

/**
 * Verifies if the provided password matches the hashed password.
 *
 * @param hash - The hashed password to compare against.
 * @param password - The plain text password to verify.
 * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
 */
export async function verifyPasswordHash(hash: string, password: string): Promise<boolean> {
	const passwordHash = await hashPassword(password);
	return passwordHash === hash;
}

/**
 * Verifies the strength of a given password.
 *
 * The password must meet the following criteria:
 * - Be between 6 and 255 characters in length.
 * - Not be a known unsafe password.
 * - Not be found in the pwned password database.
 *
 * @param password - The password to verify.
 * @returns A promise that resolves to `true` if the password is strong/secure enough, otherwise `false`.
 */
export async function verifyPasswordStrength(password: string): Promise<boolean> {
	// Password must be between 6 ~ 255 characters
	if (password.length < 6 || password.length > 255) {
		return false;
	}

	// Check if password is known unsafe password
	// const isUnsafe = checkIfUnsafe(password).password();
	// if (isUnsafe) {
	// 	return false;
	// }

	// Check if password is in pwned password database
	const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(password)));
	const hashPrefix = hash.slice(0, 5);
	const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`);
	const data = await response.text();
	const lines = data.split('\n');
	for (const line of lines) {
		const hashSuffix = line.slice(0, 35).toLowerCase();
		if (hash === hashPrefix + hashSuffix) {
			return false;
		}
	}

	// Password is strong/secure enough
	return true;
}
