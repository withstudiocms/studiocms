import { Cause, Data, Effect } from 'effect';

/**
 * Represents an error that occurs during SQL execution.
 */
export class SqlError extends Data.TaggedError('SqlError')<{ cause: unknown }> {}

/**
 * Represents an error that occurs when determining the database dialect.
 */
export class DialectDeterminationError extends Data.TaggedError('DialectDeterminationError')<{
	cause: unknown;
}> {}

/**
 * Handles migration errors by logging the cause and terminating the effect.
 *
 * @param cause - The cause of the migration failure.
 * @returns An effect that logs the error and dies.
 */
export const handleCause = (cause: Cause.Cause<DialectDeterminationError | SqlError>) =>
	Effect.logError(`Migration failure: ${Cause.pretty(cause)}`).pipe(
		Effect.map(() => Effect.die(new Error('Migration failed. See logs for details.')))
	);
