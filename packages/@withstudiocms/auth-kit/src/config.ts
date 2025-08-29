import { Brand, Context, Layer } from '@withstudiocms/effect';
import { ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import type { SessionConfig, UserTools } from './types.js';
import { defaultSessionConfig } from './utils/session.js';

/**
 * Represents the raw configuration object for the Auth Kit.
 *
 * @property CMS_ENCRYPTION_KEY - The encryption key used by the CMS for securing sensitive data.
 * @property session - The required session configuration settings.
 * @property userTools - The user tools configuration.
 */
export type RawAuthKitConfig = {
	CMS_ENCRYPTION_KEY: string;
	session: Required<SessionConfig>;
	userTools: UserTools;
};

/**
 * Configuration options for the AuthKit module.
 *
 * @property CMS_ENCRYPTION_KEY - The encryption key used for securing CMS data.
 * @property scrypt - Configuration options for the scrypt password hashing algorithm.
 * @property session - Required session configuration options.
 * @property userTools - Tools and utilities related to user management.
 * @remarks
 * This type is branded as 'AuthKitConfig' to provide nominal typing.
 */
export type AuthKitConfig = {
	CMS_ENCRYPTION_KEY: string;
	scrypt: ScryptConfigOptions;
	session: Required<SessionConfig>;
	userTools: UserTools;
} & Brand.Brand<'AuthKitConfig'>;

/**
 * A nominal type for the AuthKit configuration object.
 *
 * This constant uses the `Brand.nominal` utility to create a strongly-typed
 * identifier for the `AuthKitConfig` type, ensuring type safety and preventing
 * accidental misuse of configuration objects.
 *
 * @see AuthKitConfig
 * @see Brand.nominal
 */
export const AuthKitConfig = Brand.nominal<AuthKitConfig>();

/**
 * Provides configuration options for the AuthKit module.
 *
 * @remarks
 * This class extends a tagged context for dependency injection and configuration management.
 *
 * @example
 * ```typescript
 * const options = AuthKitOptions.Live({
 *   CMS_ENCRYPTION_KEY: 'secret-key',
 *   session: { ... },
 *   userTools: { ... }
 * });
 * ```
 */
export class AuthKitOptions extends Context.Tag('AuthKitOptions')<AuthKitOptions, AuthKitConfig>() {
	/**
	 * Creates a live instance of `AuthKitOptions` using the provided raw configuration.
	 *
	 * @param CMS_ENCRYPTION_KEY - The encryption key used for cryptographic operations.
	 * @param session - session configuration overrides.
	 * @param userTools - Tools or utilities related to user management.
	 * @returns A Layer that provides the configured `AuthKitOptions`.
	 *
	 * @remarks
	 * - Scrypt parameters (`N`, `r`, `p`) are read from environment variables (`SCRYPT_N`, `SCRYPT_R`, `SCRYPT_P`),
	 *   with sensible defaults and minimum values enforced for security.
	 * - The session configuration merges defaults with any provided overrides.
	 * - The returned Layer can be used for dependency injection in the application.
	 */
	static Live = ({ CMS_ENCRYPTION_KEY, session: _session, userTools }: RawAuthKitConfig) => {
		// Validate encryption key (expects base64-encoded 16 bytes for AES-128)
		const normalizedKey = CMS_ENCRYPTION_KEY.trim();
		if (normalizedKey.length === 0) {
			throw new Error('CMS_ENCRYPTION_KEY must be a non-empty base64 string');
		}
		try {
			const raw =
				typeof Buffer !== 'undefined'
					? Buffer.from(CMS_ENCRYPTION_KEY, 'base64')
					: new Uint8Array(
							atob(CMS_ENCRYPTION_KEY)
								.split('')
								.map((c) => c.charCodeAt(0))
						);
			if (raw.byteLength !== 16) {
				throw new Error(`CMS_ENCRYPTION_KEY must decode to 16 bytes, got ${raw.byteLength}`);
			}
		} catch {
			throw new Error('CMS_ENCRYPTION_KEY is not valid base64');
		}

		// Scrypt parameters
		const clamp = (v: number, min: number, max: number) =>
			Number.isSafeInteger(v) ? Math.min(max, Math.max(min, v)) : min;
		const env = (k: string) =>
			typeof process !== 'undefined' && process.env ? process.env[k] : undefined;
		const parsedN = Number.parseInt(env('SCRYPT_N') ?? '', 10);
		const parsedR = Number.parseInt(env('SCRYPT_R') ?? '', 10);
		const parsedP = Number.parseInt(env('SCRYPT_P') ?? '', 10);
		const toPowerOfTwo = (n: number) => 1 << Math.floor(Math.log2(n));
		const baseN = clamp(parsedN, 16384, 1 << 20); // [16k, 1,048,576]
		const SCRYPT_N = toPowerOfTwo(baseN);
		const SCRYPT_R = clamp(parsedR, 8, 32);
		const SCRYPT_P = clamp(parsedP, 1, 16);

		const scrypt = ScryptConfigOptions({
			encryptionKey: normalizedKey,
			keylen: 64,
			options: {
				N: SCRYPT_N,
				r: SCRYPT_R,
				p: SCRYPT_P,
			},
		});

		const session = {
			...defaultSessionConfig,
			...(_session ?? {}),
		};
		if (typeof session.cookieName !== 'string' || session.cookieName.trim() === '') {
			throw new Error('session.cookieName must be a non-empty string');
		}
		if (!Number.isSafeInteger(session.expTime) || session.expTime <= 0) {
			throw new Error('session.expTime must be a positive integer (ms)');
		}

		return Layer.succeed(
			this,
			this.of(AuthKitConfig({ CMS_ENCRYPTION_KEY, scrypt, session, userTools }))
		);
	};
}
