import { makeScrypt, Password } from '@withstudiocms/auth-kit';
import { PasswordModOptions } from '@withstudiocms/auth-kit/config';
import { CheckIfUnsafe } from '@withstudiocms/auth-kit/utils/unsafeCheck';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { Effect, runEffect } from '../../effect.js';

dotenv.config({ quiet: true });

let { CMS_ENCRYPTION_KEY } = process.env;

if (!CMS_ENCRYPTION_KEY) {
	console.warn(
		`${chalk.yellow.bold('Warning:')} ${chalk.yellow(
			'CMS_ENCRYPTION_KEY is not set... '
		)}${chalk.gray('Some commands may be disabled.')}`
	);
	CMS_ENCRYPTION_KEY = '+URKVIiIM1kmG6g9Znb10g=='; // Fallback key for type safety, do not use in production
}

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
const { hashPassword, verifyPasswordStrength } = await runEffect(
	Effect.gen(function* () {
		const config = yield* PasswordModOptions;
		const Scrypt = yield* makeScrypt(config);
		const { hashPassword, verifyPasswordStrength } = yield* Password(Scrypt);
		return { hashPassword, verifyPasswordStrength };
	}).pipe(Effect.provide(PasswordModOptions.Live({ CMS_ENCRYPTION_KEY })))
);

const getCheckers = Effect.gen(function* () {
	const { _tag, ...mod } = yield* CheckIfUnsafe;
	return mod;
}).pipe(Effect.provide(CheckIfUnsafe.Default));

export { hashPassword, verifyPasswordStrength, getCheckers };
