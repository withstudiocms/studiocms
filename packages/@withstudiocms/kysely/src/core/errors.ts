import { Data } from 'effect';
import type { ParseError } from 'effect/ParseResult';

/**
 * Error thrown when a query cannot be parsed.
 *
 * This class is a tagged error named "QueryParseError" that wraps the underlying
 * parser diagnostic information on the `parseError` property. Use it to detect
 * and handle query parse failures and to inspect detailed parsing diagnostics.
 *
 * @remarks
 * The wrapped `parseError` contains specifics from the parser (location, message,
 * and any other metadata provided by the parser implementation).
 *
 * @example
 * ```ts
 * throw new QueryParseError({ parseError });
 * ```
 */
export class QueryParseError extends Data.TaggedError('QueryParseError')<{
	parseError: ParseError;
}> {}

/**
 * Error type representing failures that occur while executing or building a database query.
 *
 * This class is a tagged error with the tag "QueryError" and carries a payload with a
 * `message` property describing the failure. It can be thrown by query execution code
 * and caught by callers to handle query-specific failures.
 *
 * @example
 * try {
 *   await db.execute(query);
 * } catch (err) {
 *   if (err instanceof QueryError) {
 *     // Handle query failure
 *     console.error(err.message);
 *   } else {
 *     throw err;
 *   }
 * }
 *
 * @remarks
 * The underlying implementation uses a tagged error wrapper so consumers can distinguish
 * this error from other error types by tag or by using instanceof checks.
 */
export class QueryError extends Data.TaggedError('QueryError')<{
	message: string;
}> {}

/**
 * Error used to indicate that a requested entity or resource could not be found.
 *
 * This class represents a specific "not found" failure and is intended to be
 * thrown when lookups (database queries, in-memory searches, etc.) return no result.
 * It is tagged so callers can reliably detect this error type.
 *
 * @remarks
 * Prefer throwing this error for missing records or resources rather than using
 * generic Error instances, so callers can handle 404-style conditions explicitly.
 *
 * @example
 * try {
 *   const item = await repository.getById(id);
 *   if (!item) throw new NotFoundError('Item not found');
 * } catch (err) {
 *   if (err instanceof NotFoundError) {
 *     // handle not-found (e.g., return 404 to client)
 *   } else {
 *     throw err;
 *   }
 * }
 */
export class NotFoundError extends Data.TaggedError('NotFoundError') {}

/**
 * Represents any error that can be produced by database operations.
 *
 * This union type covers the specific error variants that callers
 * may encounter when working with the database layer:
 *
 * - QueryParseError: indicates a problem parsing or validating a query.
 * - QueryError: indicates an execution-time/database-level error.
 * - NotFoundError: indicates that a requested record was not found.
 *
 * Consumers should narrow this union (for example with instanceof checks
 * or discriminant properties) to handle each case appropriately.
 *
 * @public
 */
export type DatabaseError = QueryParseError | QueryError | NotFoundError;

/**
 * Error thrown when a migration operation fails.
 *
 * This class is a tagged error named "MigratorError" that includes a `cause` property
 * to hold the underlying reason for the migration failure.
 */
export class MigratorError extends Data.TaggedError('MigratorError')<{
	cause: unknown;
}> {}
