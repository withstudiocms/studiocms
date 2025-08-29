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
	 * @param _session - Optional session configuration overrides.
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
		// Scrypt parameters
		const parsedN = Number.parseInt(process.env.SCRYPT_N ?? '', 10);
		const SCRYPT_N = Number.isFinite(parsedN) ? Math.max(16384, parsedN) : 16384;
		const parsedR = Number.parseInt(process.env.SCRYPT_R ?? '', 10);
		const SCRYPT_R = Number.isFinite(parsedR) ? Math.max(8, parsedR) : 8;
		const parsedP = Number.parseInt(process.env.SCRYPT_P ?? '', 10);
		const SCRYPT_P = Number.isFinite(parsedP) ? Math.max(1, parsedP) : 1;

		const scrypt = ScryptConfigOptions({
			encryptionKey: CMS_ENCRYPTION_KEY,
			keylen: 64,
			options: {
				N: SCRYPT_N,
				r: SCRYPT_R,
				p: SCRYPT_P,
			},
		});

		const session = {
			...defaultSessionConfig,
			..._session,
		};

		return Layer.succeed(
			this,
			this.of(AuthKitConfig({ CMS_ENCRYPTION_KEY, scrypt, session, userTools }))
		);
	};
}
