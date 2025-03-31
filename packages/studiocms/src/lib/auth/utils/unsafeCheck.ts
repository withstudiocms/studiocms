import passwordList from './lists/passwords.js';
import usernameList from './lists/usernames.js';

/**
 * Checks if a value is a reserved username or password
 *
 * @param value - The value to check
 * @returns An object containing functions to check if the value is a reserved username or password
 */
function checkIfUnsafe(value: string) {
	return {
		username: () => usernameList.includes(value),
		password: () => passwordList.includes(value),
	};
}

export default checkIfUnsafe;
