import { scrypt as nodeScrypt } from 'node:crypto';
import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
import { sha1 } from '@oslojs/crypto/sha1';
import { encodeHexLowerCase } from '@oslojs/encoding';
import checkIfUnsafe from './utils/unsafeCheck.js';

/**
 * Removes the last element from a tuple type.
 *
 * @template T - The tuple type from which the last element will be removed.
 * @typeParam T - A tuple type.
 * @returns A new tuple type with the last element removed.
 *
 * @example
 * ```typescript
 * type Original = [1, 2, 3];
 * type Modified = RemoveLast<Original>; // [1, 2]
 * ```
 */
type RemoveLast<T extends unknown[]> = T extends [...infer Rest, infer _Last] ? Rest : never;

/**
 * A wrapper function for the `nodeScrypt` function that returns a Promise.
 * This function takes all the parameters of `nodeScrypt` except the last one (callback),
 * and returns a Promise that resolves with the derived key or rejects with an error.
 *
 * @param {...RemoveLast<Parameters<typeof nodeScrypt>>} opts - The parameters for the `nodeScrypt` function, excluding the callback.
 * @returns {Promise<Buffer>} A Promise that resolves with the derived key as a Buffer.
 */
function scrypt(...opts: RemoveLast<Parameters<typeof nodeScrypt>>): Promise<Buffer> {
	return new Promise((res, rej) => {
		nodeScrypt(...opts, (err, derivedKey) => {
			if (err) rej(err);
			else res(derivedKey);
		});
	});
}

// TODO: Remove this system in a future update
/**
 * Old Hash Password function
 *
 * @deprecated
 */
async function legacyHashPassword(password: string): Promise<string> {
	const hashedPassword = await scrypt(password, CMS_ENCRYPTION_KEY, 64, {});
	return hashedPassword.toString();
}

/**
 * Hashes a plain text password using script.
 *
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
	const hashedPassword = await scrypt(password, CMS_ENCRYPTION_KEY, 64, {});
	return `gen1:${hashedPassword.toString('hex')}`;
}

/**
 * Verifies if the provided password matches the hashed password.
 *
 * @param hash - The hashed password to compare against.
 * @param password - The plain text password to verify.
 * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
 */
export async function verifyPasswordHash(hash: string, password: string): Promise<boolean> {
	// Remove this when legacyHashPassword is removed.
	if (!hash.startsWith('gen1:')) return hash === (await legacyHashPassword(password));
	return hash === (await hashPassword(password));
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
export async function verifyPasswordStrength(password: string): Promise<true | string> {
	// Password must be between 6 ~ 255 characters
	if (password.length < 6 || password.length > 255) {
		return 'Password must be between 6 and 255 characters';
	}

	// Check if password is known unsafe password
	if (checkIfUnsafe(password).password()) {
		return 'Password must not be a commonly known unsafe password (admin, root, etc.)';
	}

	// Check if password is in pwned password database
	const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(password)));
	const hashPrefix = hash.slice(0, 5);
	const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`);
	const data = await response.text();
	const lines = data.split('\n');
	for (const line of lines) {
		const hashSuffix = line.slice(0, 35).toLowerCase();
		if (hash === hashPrefix + hashSuffix) {
			return 'Password must not be in the <a href="https://haveibeenpwned.com/Passwords" target="_blank">pwned password database</a>.';
		}
	}

	// Password is strong/secure enough
	return true;
}
