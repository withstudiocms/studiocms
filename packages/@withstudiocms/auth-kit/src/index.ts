import { Effect } from '@withstudiocms/effect';
import { Scrypt as _Scrypt } from '@withstudiocms/effect/scrypt';
import { AuthKitOptions, PasswordModConfigFinal, type RawAuthKitConfig } from './config.js';
import { _Encryption, _Password, _Session, _User } from './modules/index.js';

export { Password } from './modules/password.js';

/**
 * Creates a scrypt password hashing utility using the provided scrypt configuration.
 *
 * @param scrypt - The scrypt configuration object from `PasswordModConfigFinal`.
 * @returns An Effect that provides an object with a `run` method for performing scrypt operations.
 */
export const makeScrypt = Effect.fn((config: PasswordModConfigFinal) =>
	Effect.try({
		try: () =>
			Effect.gen(function* () {
				const { run } = yield* _Scrypt;
				return { run };
			}).pipe(Effect.provide(_Scrypt.makeLive(config.scrypt))),
		catch: (error) => {
			throw new Error(`Failed to create Scrypt instance: ${(error as Error).message}`);
		},
	})
);

/**
 * The `AuthKit` service provides a collection of authentication utilities for use within the
 * @withstudiocms ecosystem. It exposes encryption, password management, session management,
 * and user management utilities, all configured via dependency injection.
 *
 * @remarks
 * This service is built on top of the Effect system, allowing for composable and testable
 * authentication logic. Each utility is wrapped with tracing spans for observability.
 *
 * @example
 * ```typescript
 * const authKit = AuthKit.makeConfig({
 *   CMS_ENCRYPTION_KEY: 'secret-key',
 *   session: ...,
 *   userTools: ...
 * });
 * ```
 *
 * @property Encryption - Provides encryption and decryption utilities using the configured key.
 * @property Password - Utilities for password hashing and verification using Scrypt.
 * @property Session - Session management utilities for handling user sessions.
 * @property User - User management utilities, including authentication and user lookup.
 *
 * @method static makeConfig
 * Creates a live configuration for the AuthKit service using the provided raw configuration.
 *
 * @see AuthKitOptions
 * @see _Scrypt
 * @see _Encryption
 * @see _Password
 * @see _Session
 * @see _User
 */
export class AuthKit extends Effect.Service<AuthKit>()('@withstudiocms/AuthKit', {
	effect: Effect.gen(function* () {
		const { CMS_ENCRYPTION_KEY, scrypt, session, userTools } = yield* AuthKitOptions;

		/**
		 * Scrypt Effect processor
		 * @private
		 */
		const Scrypt = yield* Effect.withSpan('@withstudiocms/AuthKit.Scrypt')(
			makeScrypt(PasswordModConfigFinal({ scrypt }))
		);

		/**
		 * Encryption utilities
		 */
		const Encryption = Effect.withSpan('@withstudiocms/AuthKit.Encryption')(
			_Encryption(CMS_ENCRYPTION_KEY)
		);

		/**
		 * Password management utilities
		 */
		const Password = Effect.withSpan('@withstudiocms/AuthKit.Password')(_Password(Scrypt));

		/**
		 * Session management utilities
		 */
		const Session = Effect.withSpan('@withstudiocms/AuthKit.Session')(_Session(session));

		/**
		 * User management utilities
		 */
		const User = Effect.withSpan('@withstudiocms/AuthKit.User')(
			_User({ Scrypt, session, userTools })
		);

		return {
			Encryption,
			Password,
			Session,
			User,
		} as const;
	}),
}) {
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
	static makeConfig = (config: RawAuthKitConfig) => AuthKitOptions.Live(config);
}
