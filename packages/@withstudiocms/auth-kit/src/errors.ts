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
 * Error thrown when a safety check fails, indicating an unsafe condition.
 *
 * @extends Data.TaggedError
 * @template {object} T - The shape of the error data.
 * @property {string} message - A descriptive message explaining why the error was thrown.
 */
export class CheckIfUnsafeError extends Data.TaggedError('CheckIfUnsafeError')<{
	message: string;
}> {}

/**
 * Represents an error related to session handling within the authentication kit.
 *
 * @extends {Data.TaggedError<'SessionError', { cause: unknown }>}
 *
 * @example
 * throw new SessionError({ cause: someError });
 *
 * @property {unknown} cause - The underlying cause of the session error.
 */
export class SessionError extends Data.TaggedError('SessionError')<{ cause: unknown }> {}

/**
 * Represents an error related to user operations within the authentication kit.
 *
 * @extends Data.TaggedError
 * @template { cause: unknown } - The shape of the error details.
 *
 * @example
 * throw new UserError({ cause: someError });
 */
export class UserError extends Data.TaggedError('UserError')<{ cause: unknown }> {}

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

/**
 * Executes a function within an Effect, mapping any thrown error to a `SessionError`.
 *
 * @template A - The return type of the function to execute.
 * @param _try - A function that returns a value of type `A`. If this function throws, the error is caught and wrapped in a `SessionError`.
 * @returns An `Effect` that yields the result of `_try` or fails with a `SessionError` if an error is thrown.
 */
export const useSessionError = <A>(_try: () => A): Effect.Effect<A, SessionError> =>
	Effect.try({
		try: _try,
		catch: (cause) => new SessionError({ cause }),
	});

/**
 * Wraps an asynchronous function in an Effect that captures any thrown errors
 * and converts them into a `SessionError`.
 *
 * @template A The type of the resolved value from the promise.
 * @param _try - A function that returns a promise to be executed.
 * @returns An `Effect` that resolves with the value of the promise or fails with a `SessionError`.
 */
export const useSessionErrorPromise = <A>(_try: () => Promise<A>): Effect.Effect<A, SessionError> =>
	Effect.tryPromise({
		try: _try,
		catch: (cause) => new SessionError({ cause }),
	});

/**
 * Executes a provided function within an Effect, catching any thrown errors and wrapping them
 * in a `CheckIfUnsafeError` with a prefixed message.
 *
 * @template A - The return type of the function to execute.
 * @param _try - A function to execute that may throw an error.
 * @param prefix - A string to prefix to the error message if an error is caught.
 * @returns An Effect that yields the result of the function or a `CheckIfUnsafeError` if an error occurs.
 */
export const useUnsafeCheckError = <A>(
	_try: () => A,
	prefix: string
): Effect.Effect<A, CheckIfUnsafeError> =>
	Effect.try({
		try: _try,
		catch: (cause) => new CheckIfUnsafeError({ message: `${prefix}: ${cause}` }),
	});

/**
 * Executes a function within an Effect, mapping any thrown error to a `UserError`.
 *
 * @typeParam A - The return type of the function to execute.
 * @param _try - A function to execute that may throw an error.
 * @returns An `Effect` that yields the result of the function or a `UserError` if an error is thrown.
 */
export const useUserError = <A>(_try: () => A): Effect.Effect<A, UserError> =>
	Effect.try({
		try: _try,
		catch: (cause) => new UserError({ cause }),
	});

/**
 * Wraps a promise-returning function in an Effect, mapping any thrown error to a `UserError`.
 *
 * @template A The type of the resolved value from the promise.
 * @param _try - A function that returns a promise of type `A`.
 * @returns An `Effect` that resolves with the value of type `A` or fails with a `UserError`.
 */
export const useUserErrorPromise = <A>(_try: () => Promise<A>): Effect.Effect<A, UserError> =>
	Effect.tryPromise({
		try: _try,
		catch: (cause) => new UserError({ cause }),
	});

export class AuthKitError extends Data.TaggedError('AuthKitError')<{
	message: string;
	cause?: unknown;
}> {}
