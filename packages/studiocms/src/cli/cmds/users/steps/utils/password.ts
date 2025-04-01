import { scrypt as nodeScrypt } from 'node:crypto';

export async function checkPassword(hashPrefix: string, hash: string) {
	return fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`)
		.catch((error) => {
			throw new Error(`Failed to check password security: ${error.message}`);
		})
		.then((res) => {
			if (!res.ok) {
				throw new Error(`Pwned Passwords API returned status ${res.status}`);
			}
			return res.text();
		})
		.then((data) => {
			const lines = data.split('\n');
			for (const line of lines) {
				const hashSuffix = line.slice(0, 35).toLowerCase();
				if (hash === hashPrefix + hashSuffix) {
					throw new Error(
						'Password must not be in the pwned password database: https://haveibeenpwned.com/Passwords'
					);
				}
			}
		});
}

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

/**
 * Hashes a plain text password using scrypt.
 *
 * @param password - The plain text password to hash.
 * @param CMS_ENCRYPTION_KEY - The encryption key used for password hashing.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string, CMS_ENCRYPTION_KEY: string): Promise<string> {
	const hashedPassword = await scrypt(password, CMS_ENCRYPTION_KEY, 64, {});
	return hashedPassword.toString();
}
