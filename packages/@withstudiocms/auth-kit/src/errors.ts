import { Data, Effect } from '@withstudiocms/effect';

/**
 * Represents an error that occurs during encryption operations.
 *
 * @extends Data.TaggedError<'EncryptionError'>
 * @template { cause: unknown } - The shape of the error details.
 *
 * @property {unknown} cause - The underlying cause of the encryption error.
 */
export class EncryptionError extends Data.TaggedError('EncryptionError')<{
	cause: unknown;
}> {}

/**
 * Represents an error that occurs during the decryption process.
 *
 * @extends Data.TaggedError
 * @tag DecryptionError
 * @property {unknown} cause - The underlying cause of the decryption failure.
 */
export class DecryptionError extends Data.TaggedError('DecryptionError')<{
	cause: unknown;
}> {}

/**
 * PasswordError is a custom error class for handling password-related errors.
 * It extends the TaggedError class from the Data module, allowing for structured error handling.
 */
export class PasswordError extends Data.TaggedError('PasswordError')<{
	cause?: unknown;
	message?: string;
}> {}

/**
 * Executes a function within an Effect context, capturing any thrown errors as an `EncryptionError`.
 *
 * @template A - The return type of the function to execute.
 * @param _try - A function that may throw an error.
 * @returns An `Effect` that yields the result of the function or an `EncryptionError` if an exception is thrown.
 */
export const useEncryptionError = <A>(_try: () => A): Effect.Effect<A, EncryptionError> =>
	Effect.try({
		try: _try,
		catch: (cause) => new EncryptionError({ cause }),
	});

/**
 * Executes the provided function within an Effect context, mapping any thrown error
 * to a `DecryptionError`.
 *
 * @typeParam A - The type of the value returned by the function.
 * @param _try - A function that may throw an error during execution.
 * @returns An `Effect` that yields the result of the function or a `DecryptionError` if an error is thrown.
 */
export const useDecryptionError = <A>(_try: () => A): Effect.Effect<A, DecryptionError> =>
	Effect.try({
		try: _try,
		catch: (cause) => new DecryptionError({ cause }),
	});

/**
 * Executes a function that may throw and wraps any thrown error in a `PasswordError`.
 *
 * @template A - The return type of the function to execute.
 * @param _try - A function that may throw an error.
 * @returns An `Effect` that yields the result of the function or a `PasswordError` if an error is thrown.
 */
export const usePasswordError = <A>(_try: () => A): Effect.Effect<A, PasswordError> =>
	Effect.try({
		try: _try,
		catch: (cause) => new PasswordError({ cause }),
	});
