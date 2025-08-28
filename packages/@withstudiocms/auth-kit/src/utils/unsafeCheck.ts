import { Effect } from '@withstudiocms/effect';
import { useUnsafeCheckError } from '../errors.js';
import passwordList from './lists/passwords.js';
import usernameList from './lists/usernames.js';

/**
 * A service class that provides utility functions to check if a value is unsafe,
 * such as being a reserved username or a password.
 *
 * @remarks
 * This service uses logging and effect-based programming to perform the checks.
 *
 * @example
 * ```typescript
 * const checkIfUnsafe = CheckIfUnsafe;
 * const isReservedUsername = yield* checkIfUnsafe.username('admin');
 * const isPassword = yield* checkIfUnsafe.password('123456');
 * ```
 *
 * @class
 * @implements {Effect.Service<CheckIfUnsafe>}
 */
export class CheckIfUnsafe extends Effect.Service<CheckIfUnsafe>()(
	'studiocms/virtuals/auth/utils/unsafeCheck/CheckIfUnsafe',
	{
		effect: Effect.gen(function* () {
			/**
			 * Checks if a value is a reserved username
			 *
			 * @param value - The value to check
			 * @returns An object containing functions to check if the value is a reserved username or password
			 */
			const username = (val: string) =>
				useUnsafeCheckError(
					() => usernameList.has(val),
					'An unknown Error occurred when checking the username list'
				);

			/**
			 * Checks if a value is a password
			 *
			 * @param value - The value to check
			 * @returns An object containing functions to check if the value is a reserved username or password
			 */

			const password = (val: string) =>
				useUnsafeCheckError(
					() => passwordList.has(val),
					'An unknown Error occurred when checking the password list'
				);

			return {
				username,
				password,
			};
		}),
	}
) {}
