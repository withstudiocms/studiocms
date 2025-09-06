import { makeScrypt, Password } from '@withstudiocms/auth-kit';
import { PasswordModOptions } from '@withstudiocms/auth-kit/config';
import { Effect, runEffect } from '../../effect.js';

/**
 * Asynchronously initializes and retrieves the `hashPassword` function using the provided
 * password module options and Scrypt configuration. The configuration is supplied via
 * the `CMS_ENCRYPTION_KEY` environment variable. This utility is typically used for
 * securely hashing user passwords within the CMS.
 *
 * @remarks
 * - Uses an effect system to manage dependencies and asynchronous operations.
 * - The Scrypt algorithm is used for password hashing.
 * - The function is provided with live password module options.
 *
 * @returns An object containing the `hashPassword` function.
 *
 * @throws If the password module options or Scrypt configuration fail to initialize.
 */
const hashPassword = await runEffect(
	Effect.gen(function* () {
		const config = yield* PasswordModOptions;
		const Scrypt = yield* makeScrypt(config);
		const { hashPassword } = yield* Password(Scrypt);
		return hashPassword;
	}).pipe(
		Effect.provide(
			PasswordModOptions.Live({ CMS_ENCRYPTION_KEY: process.env.CMS_ENCRYPTION_KEY || '' })
		)
	)
);

export { hashPassword };
