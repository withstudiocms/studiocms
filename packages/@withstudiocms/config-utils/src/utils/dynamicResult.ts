/**
 * The Success type represents a successful result with a value of type T.
 * It is used to indicate that an operation was successful and contains the result.
 */
export type Success<T> = [T, null];

/**
 * The Failure type represents a failure with an error of type E.
 * It is used to indicate that an operation failed and contains the error.
 */
export type Failure<E> = [null, E];

/**
 * The Result type is a discriminated union that can either be a Success or a Failure.
 * It is used to represent the outcome of an operation, where:
 * - Success<T> represents a successful result with a value of type T.
 * - Failure<E> represents a failure with an error of type E.
 */
export type Result<T, E> = Success<T> | Failure<E>;
