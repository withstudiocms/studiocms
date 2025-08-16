import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
import { Scrypt as _Scrypt, ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import { Effect } from '../../../effect.js';

const parsedN = Number.parseInt(process.env.SCRYPT_N ?? '', 10);
const SCRYPT_N = Number.isFinite(parsedN) ? Math.max(16384, parsedN) : 16384;
const parsedR = Number.parseInt(process.env.SCRYPT_R ?? '', 10);
const SCRYPT_R = Number.isFinite(parsedR) ? Math.max(8, parsedR) : 8;
const parsedP = Number.parseInt(process.env.SCRYPT_P ?? '', 10);
const SCRYPT_P = Number.isFinite(parsedP) ? Math.max(1, parsedP) : 1;

/**
 * Provides a configured Scrypt effect for password hashing and verification.
 *
 * This effect is initialized with the provided Scrypt configuration options,
 * including the encryption key, key length, and scrypt parameters (N, r, p).
 * The returned object exposes a `run` method for performing scrypt operations.
 *
 * @remarks
 * - Uses dependency injection to provide the live Scrypt implementation.
 * - Configuration values are sourced from environment or constants.
 *
 * @returns {Effect<{ run: Function }>} An Effect containing the Scrypt `run` method.
 */
export const Scrypt = Effect.gen(function* () {
	const { run } = yield* _Scrypt;
	return { run };
}).pipe(
	Effect.provide(
		_Scrypt.makeLive(
			ScryptConfigOptions({
				encryptionKey: CMS_ENCRYPTION_KEY,
				keylen: 64,
				options: {
					N: SCRYPT_N,
					r: SCRYPT_R,
					p: SCRYPT_P,
				},
			})
		)
	)
);
