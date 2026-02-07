import type { Result } from './dynamicResult.js';

/**
 * A utility function that wraps a promise or a synchronous function call in a try-catch block.
 * It returns a tuple where the first element is the result (or null if an error occurred)
 * and the second element is the error (or null if no error occurred).
 *
 * @param fn - The function to execute, which can be a promise or a synchronous function.
 * @returns A promise that resolves to a tuple containing the result and error.
 */
export async function tryCatch<T, E = Error>(fn: () => T | Promise<T>): Promise<Result<T, E>>;
export async function tryCatch<T, E = Error>(value: Promise<T>): Promise<Result<T, E>>;

export async function tryCatch<T, E = Error>(
	fnOrValue: (() => T | Promise<T>) | Promise<T>
): Promise<Result<T, E>> {
	try {
		const result = typeof fnOrValue === 'function' ? fnOrValue() : fnOrValue;

		// If the result is a promise, wait for it to resolve
		if (result instanceof Promise) {
			const resolvedResult = await result;
			return [resolvedResult, null];
		}

		// If the result is not a promise, return it directly
		return [result, null];
	} catch (error) {
		// If an error occurs, return null for the result
		// and the error as the second element of the tuple
		return [null, error as E];
	}
}
