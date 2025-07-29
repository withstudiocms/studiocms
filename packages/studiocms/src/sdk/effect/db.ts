import { db as client } from 'astro:db';
import type { Database as Client } from '@astrojs/db/runtime';
import type { ResultSet } from '@libsql/client';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { Cause, Context, Data, Effect, Exit, Option, Runtime } from 'effect';

/**
 * Represents an error thrown by the LibSQL database integration.
 *
 * This error class is tagged for identification and provides a set of error types
 * that describe various failure scenarios encountered when interacting with the database.
 *
 * @remarks
 * The error includes a `cause` property containing the underlying error, and overrides
 * the `toString` and `message` properties for improved error reporting.
 *
 * @typeParam type - The specific type of database error, such as 'URL_INVALID', 'TRANSACTION_CLOSED', etc.
 * @property type - The type of the database error.
 * @property cause - The underlying error that caused this database error.
 */
export class LibSQLDatabaseError extends Data.TaggedError(
	'studiocms/sdk/effect/db/LibSQLDatabaseError'
)<{
	readonly type:
		| 'URL_INVALID'
		| 'URL_PARAM_NOT_SUPPORTED'
		| 'URL_SCHEME_NOT_SUPPORTED'
		| 'TRANSACTION_CLOSED'
		| 'CLIENT_CLOSED'
		| 'ENCRYPTION_KEY_NOT_SUPPORTED'
		| 'SYNC_NOT_SUPPORTED'
		| 'HRANA_PROTO_ERROR'
		| 'HRANA_CLOSED_ERROR'
		| 'HRANA_WEBSOCKET_ERROR'
		| 'SERVER_ERROR'
		| 'PROTOCOL_VERSION_ERROR'
		| 'INTERNAL_ERROR'
		| 'UNKNOWN'
		| 'WEBSOCKETS_NOT_SUPPORTED';
	readonly cause: Error;
}> {
	public override toString() {
		return `DatabaseError: ${this.cause.message}`;
	}

	public get message() {
		return this.cause.message;
	}
}

/**
 * Matches a given error against known LibSQL client error codes and returns a `LibSQLDatabaseError`
 * if a match is found. If the error does not match any known codes, returns `null`.
 *
 * @param error - The error object to match against known LibSQL client error codes.
 * @returns A `LibSQLDatabaseError` instance if the error code matches, otherwise `null`.
 */
export const LibSQLmatchClientError = (error: unknown) => {
	if (error instanceof Error && 'code' in error) {
		switch (error.code) {
			case 'URL_INVALID':
			case 'URL_PARAM_NOT_SUPPORTED':
			case 'URL_SCHEME_NOT_SUPPORTED':
			case 'TRANSACTION_CLOSED':
			case 'CLIENT_CLOSED':
			case 'ENCRYPTION_KEY_NOT_SUPPORTED':
			case 'SYNC_NOT_SUPPORTED':
			case 'HRANA_PROTO_ERROR':
			case 'HRANA_CLOSED_ERROR':
			case 'HRANA_WEBSOCKET_ERROR':
			case 'SERVER_ERROR':
			case 'PROTOCOL_VERSION_ERROR':
			case 'INTERNAL_ERROR':
			case 'UNKNOWN':
			case 'WEBSOCKETS_NOT_SUPPORTED':
				return new LibSQLDatabaseError({ type: error.code, cause: error });
		}
	}
	return null;
};

/**
 * Represents a SQLite transaction client with asynchronous operations.
 *
 * @template 'async' - Specifies that the transaction is asynchronous.
 * @template ResultSet - The type representing the result set returned by queries.
 * @template Record<string, never> - The type for the database schema, currently an empty record.
 * @template ExtractTablesWithRelations<Record<string, never>> - Extracts tables with relations from the schema.
 */
export type TransactionClient = SQLiteTransaction<
	'async',
	ResultSet,
	Record<string, never>,
	ExtractTablesWithRelations<Record<string, never>>
>;

/**
 * Represents the shape of a transaction context function.
 *
 * @template U The type of the value returned by the transaction.
 * @param fn A function that receives a `TransactionClient` and returns a Promise of type `U`.
 * @returns An `Effect` that resolves to `U` or fails with a `LibSQLDatabaseError`.
 */
export type TransactionContextShape = <U>(
	fn: (client: TransactionClient) => Promise<U>
) => Effect.Effect<U, LibSQLDatabaseError>;

/**
 * Represents a function that executes a database operation within an effect context.
 *
 * @template T The type of the result returned by the database operation.
 * @param fn A function that receives a database client or transaction client and returns a promise of type T.
 * @returns An Effect that resolves to the result of type T or fails with a LibSQLDatabaseError.
 */
export type ExecuteFn = <T>(
	fn: (client: Client | TransactionClient) => Promise<T>
) => Effect.Effect<T, LibSQLDatabaseError>;

/**
 * Represents a transaction context for database operations within the Studiocms SDK.
 *
 * This class extends a tagged context, allowing it to be used as a dependency in effectful computations.
 *
 * @remarks
 * The context is tagged with `'studiocms/sdk/effect/db/TransactionContext'` for identification.
 *
 * @template TransactionContext - The type of the transaction context.
 * @template TransactionContextShape - The shape of the transaction context.
 *
 * @example
 * ```typescript
 * const transactionContext = new TransactionContext(...);
 * const effectWithTransaction = TransactionContext.provide(transactionContext)(someEffect);
 * ```
 */
export class TransactionContext extends Context.Tag('studiocms/sdk/effect/db/TransactionContext')<
	TransactionContext,
	TransactionContextShape
>() {
	public static readonly provide = (
		transaction: TransactionContextShape
	): (<A, E, R>(
		self: Effect.Effect<A, E, R>
	) => Effect.Effect<A, E, Exclude<R, TransactionContext>>) =>
		Effect.provideService(this, transaction);
}

/**
 * Provides an Effect-based service wrapper for interacting with an AstroDB database client.
 *
 * @remarks
 * This service exposes utility functions for executing queries, managing transactions, and composing
 * database effects using the Effect system. It handles error mapping for LibSQL client errors and
 * supports transactional execution with proper error propagation.
 *
 * @property db - The underlying database client instance.
 * @property execute - Executes a function against the database client, mapping errors to LibSQLDatabaseError when possible.
 * @property makeQuery - Composes a query effect, optionally using a transaction context if available.
 * @property transaction - Runs a provided effect within a database transaction, ensuring proper error handling and commit/rollback semantics.
 *
 * @example
 * ```typescript
 * const result = await AstroDB.execute((client) => client.query('SELECT * FROM users'));
 * ```
 */
export class AstroDB extends Effect.Service<AstroDB>()('studiocms/sdk/effect/db/AstroDB', {
	effect: Effect.gen(function* () {
		const db = client;

		/**
		 * Executes a provided asynchronous function with a database client, handling errors using a custom matcher.
		 *
		 * @template T The return type of the asynchronous function.
		 * @param fn - A function that receives a `Client` instance and returns a `Promise<T>`.
		 * @returns An `Effect` that resolves with the result of the function or a matched error.
		 *
		 * If the function throws an error, it attempts to match the error using `LibSQLmatchClientError`.
		 * If a match is found, the matched error is returned; otherwise, the original error is rethrown.
		 */
		const execute = Effect.fn(<T>(fn: (client: Client) => Promise<T>) =>
			Effect.tryPromise({
				try: () => fn(db),
				catch: (cause) => {
					const error = LibSQLmatchClientError(cause);
					if (error !== null) {
						return error;
					}
					throw cause;
				},
			})
		);

		/**
		 * Creates a query function that executes within an optional transaction context.
		 *
		 * @template A - The type of the result produced by the query function.
		 * @template E - The type of error that may be thrown by the query function.
		 * @template R - The type of environment required by the query function.
		 * @template Input - The type of input accepted by the query function (defaults to `never`).
		 *
		 * @param queryFn - A function that takes an `ExecuteFn` and an input, returning an `Effect.Effect`.
		 *                  The `ExecuteFn` is either the current transaction context or a default executor.
		 *
		 * @returns A function that accepts an input (if required) and returns an `Effect.Effect` representing the query.
		 *          If a transaction context is available, it is used; otherwise, the default executor is used.
		 */
		const makeQuery =
			<A, E, R, Input = never>(
				queryFn: (execute: ExecuteFn, input: Input) => Effect.Effect<A, E, R>
			) =>
			(...args: [Input] extends [never] ? [] : [input: Input]): Effect.Effect<A, E, R> => {
				const input = args[0] as Input;
				return Effect.serviceOption(TransactionContext).pipe(
					Effect.map(Option.getOrNull),
					Effect.flatMap((txOrNull) => queryFn(txOrNull ?? execute, input))
				);
			};

		/**
		 * Creates an Effect-based transaction wrapper for database operations.
		 *
		 * This function provides a transactional context for executing effects against a database,
		 * ensuring that all operations within the transaction are either committed or rolled back atomically.
		 * It handles error mapping using `LibSQLmatchClientError` and propagates errors through the Effect system.
		 *
		 * @template T - The type of the successful result.
		 * @template E - The type of the error that may be thrown.
		 * @template R - The environment required by the effect.
		 * @param txExecute - A function that receives a transaction context and returns an Effect to be executed within the transaction.
		 * @returns An Effect that executes the provided effect within a database transaction, handling commit/rollback and error propagation.
		 */
		const transaction = Effect.fn('studiocms/sdk/effect/db/Database.transaction')(
			<T, E, R>(txExecute: (tx: TransactionContextShape) => Effect.Effect<T, E, R>) =>
				Effect.runtime<R>().pipe(
					Effect.map((runtime) => Runtime.runPromiseExit(runtime)),
					Effect.flatMap((runPromiseExit) =>
						Effect.async<T, LibSQLDatabaseError | E, R>((resume) => {
							db.transaction(async (tx: TransactionClient) => {
								// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any.
								const txWrapper = (fn: (client: TransactionClient) => Promise<any>) =>
									Effect.tryPromise({
										try: () => fn(tx),
										catch: (cause) => {
											const error = LibSQLmatchClientError(cause);
											if (error !== null) {
												return error;
											}
											throw cause;
										},
									});

								const result = await runPromiseExit(txExecute(txWrapper));
								Exit.match(result, {
									onSuccess: (value) => {
										resume(Effect.succeed(value));
									},
									onFailure: (cause) => {
										if (Cause.isFailure(cause)) {
											resume(Effect.fail(Cause.originalError(cause) as E));
										} else {
											resume(Effect.die(cause));
										}
									},
								});
							}).catch((cause) => {
								const error = LibSQLmatchClientError(cause);
								resume(error !== null ? Effect.fail(error) : Effect.die(cause));
							});
						})
					)
				)
		);

		return {
			db,
			execute,
			makeQuery,
			transaction,
		};
	}),
}) {}
