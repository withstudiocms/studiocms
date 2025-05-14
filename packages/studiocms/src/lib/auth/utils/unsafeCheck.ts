import { Effect } from 'effect';
import { genLogger, pipeLogger } from '../../effects/index.js';
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
					Effect.try(() => usernameList.includes(val))
				);

			/**
			 * Checks if a value is a password
			 *
			 * @param value - The value to check
			 * @returns An object containing functions to check if the value is a reserved username or password
			 */
			const password = (val: string) =>
				pipeLogger('studiocms/lib/auth/utils/unsafeCheck/CheckIfUnsafe.password')(
					Effect.try(() => passwordList.includes(val))
				);

			return {
				username,
				password,
			};
		}),
		accessors: true,
	}
) {}

const _username = (val: string) =>
	Effect.runSync(CheckIfUnsafe.username(val).pipe(Effect.provide(CheckIfUnsafe.Default)));
const _password = (val: string) =>
	Effect.runSync(CheckIfUnsafe.password(val).pipe(Effect.provide(CheckIfUnsafe.Default)));

/**
 * Checks if a value is a reserved username or password
 *
 * @param value - The value to check
 * @returns An object containing functions to check if the value is a reserved username or password
 * @deprecated use Effect `CheckIfUnsafe` Class instead
 */
function checkIfUnsafe(value: string) {
	return {
		username: () => _username(value),
		password: () => _password(value),
	};
}

export default checkIfUnsafe;
