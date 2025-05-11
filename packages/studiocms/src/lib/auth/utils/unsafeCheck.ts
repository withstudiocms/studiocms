import { Effect, Layer } from 'effect';
import passwordList from './lists/passwords.js';
import usernameList from './lists/usernames.js';

export const make = Effect.gen(function* () {
	/**
	 * Checks if a value is a reserved username
	 *
	 * @param value - The value to check
	 * @returns An object containing functions to check if the value is a reserved username or password
	 */
	const username = (val: string) => Effect.try(() => usernameList.includes(val));

	/**
	 * Checks if a value is a password
	 *
	 * @param value - The value to check
	 * @returns An object containing functions to check if the value is a reserved username or password
	 */
	const password = (val: string) => Effect.try(() => passwordList.includes(val));

	return {
		username,
		password,
	};
});

export class CheckIfUnsafe extends Effect.Tag('studiocms/lib/auth/utils/unsafeCheck/CheckIfUnsafe')<
	CheckIfUnsafe,
	Effect.Effect.Success<typeof make>
>() {
	static Live = make;
	static Layer = Layer.scoped(this, this.Live);
}

const _username = (val: string) => Effect.runSync(CheckIfUnsafe.Live).username(val);
const _password = (val: string) => Effect.runSync(CheckIfUnsafe.Live).password(val);

/**
 * Checks if a value is a reserved username or password
 *
 * @param value - The value to check
 * @returns An object containing functions to check if the value is a reserved username or password
 * @deprecated use Effect `CheckIfUnsafe` Class instead
 */
function checkIfUnsafe(value: string) {
	return {
		username: () => Effect.runSync(_username(value)),
		password: () => Effect.runSync(_password(value)),
	};
}

export default checkIfUnsafe;
