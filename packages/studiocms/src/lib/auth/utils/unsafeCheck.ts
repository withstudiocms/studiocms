import { Data, Effect } from 'effect';
import { genLogger, pipeLogger } from '../../effects/index.js';
import passwordList from './lists/passwords.js';
import usernameList from './lists/usernames.js';

export class CheckIfUnsafeError extends Data.TaggedError('CheckIfUnsafeError')<{
	message: string;
}> {}

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
	'studiocms/lib/auth/utils/unsafeCheck/CheckIfUnsafe',
	{
		effect: genLogger('studiocms/lib/auth/utils/unsafeCheck/CheckIfUnsafe.effect')(function* () {
			/**
			 * Checks if a value is a reserved username
			 *
			 * @param value - The value to check
			 * @returns An object containing functions to check if the value is a reserved username or password
			 */
			const username = (val: string) =>
				pipeLogger('studiocms/lib/auth/utils/unsafeCheck/CheckIfUnsafe.username')(
					Effect.try({
						try: () => usernameList.includes(val),
						catch: (cause) =>
							new CheckIfUnsafeError({
								message: `An unknown Error occurred when checking the username list: ${cause}`,
							}),
					})
				);

			/**
			 * Checks if a value is a password
			 *
			 * @param value - The value to check
			 * @returns An object containing functions to check if the value is a reserved username or password
			 */
			const password = (val: string) =>
				pipeLogger('studiocms/lib/auth/utils/unsafeCheck/CheckIfUnsafe.password')(
					Effect.try({
						try: () => passwordList.includes(val),
						catch: (cause) =>
							new CheckIfUnsafeError({
								message: `An unknown Error occurred when checking the password list: ${cause}`,
							}),
					})
				);

			return {
				username,
				password,
			};
		}),
	}
) {}
