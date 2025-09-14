import type { Database } from '@astrojs/db/runtime';
import type { ResultSet } from '@libsql/client';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { Context, Data, Effect, Option } from './effect.js';

/**
 * Represents an error specific to the LibSQL client.
 *
 * This error extends from `Data.TaggedError` with the tag `'LibSQLClientError'`
 * and includes a `cause` property to provide additional context about the underlying issue.
 *
 * @example
 * ```typescript
 * throw new LibSQLClientError({ cause: originalError });
 * ```
 *
 * @property cause - The underlying cause of the error, can be any value.
 */
export class LibSQLClientError extends Data.TaggedError('LibSQLClientError')<{ cause: unknown }> {}

/**
 * Wraps an asynchronous function returning a Promise in an Effect,
 * converting any thrown errors into a `LibSQLClientError`.
 *
 * @template A The type of the resolved value from the Promise.
 * @param _try A function that returns a Promise of type `A`.
 * @returns An Effect that resolves with the value of the Promise,
 *          or fails with a `LibSQLClientError` if the Promise is rejected.
 */
const useWithErrorPromise = <A>(_try: () => Promise<A>) =>
	Effect.tryPromise({
		try: _try,
		catch: (cause) => new LibSQLClientError({ cause }),
	});

/**
 * Represents a SQLite transaction client with asynchronous operations.
 *
 * @typeParam 'async' - Specifies that the transaction is asynchronous.
 * @typeParam ResultSet - The result set type returned by queries.
 * @typeParam Record<string, never> - The schema type for the transaction (empty object in this case).
 * @typeParam ExtractTablesWithRelations<Record<string, never>> - Extracted table relations from the schema.
 */
export type TransactionClient<Schema extends Record<string, unknown> = Record<string, never>> =
	SQLiteTransaction<'async', ResultSet, Schema, ExtractTablesWithRelations<Schema>>;

/**
 * Represents a function that executes a provided asynchronous operation using a database client.
 *
 * @template Schema - The database schema type, defaults to an empty record.
 * @template T - The result type of the asynchronous operation.
 * @param fn - An asynchronous function that receives either a `LibSQLDatabase` or `TransactionClient`
 *             and returns a promise of type `T`.
 * @returns An `Effect` that resolves to the result of type `T` or fails with a `LibSQLClientError`.
 */
export type ExecuteFn<Schema extends Record<string, unknown> = Record<string, never>> = <T>(
	fn: (client: LibSQLDatabase<Schema> | TransactionClient<Schema>) => Promise<T>
) => Effect.Effect<T, LibSQLClientError>;

/**
 * Represents a function that executes a given asynchronous operation within a transaction context.
 *
 * @template U The type of the value returned by the provided function.
 * @param fn - A function that receives a `TransactionClient` and returns a `Promise` of type `U`.
 * @returns An `Effect` that resolves to the result of type `U` or fails with a `LibSQLClientError`.
 */
export type TransactionContextShape<
	Schema extends Record<string, unknown> = Record<string, never>,
> = <U>(
	fn: (client: TransactionClient<Schema>) => Promise<U>
) => Effect.Effect<U, LibSQLClientError>;

/**
 * Represents a context tag for managing transaction context within the Studiocms SDK effect system.
 *
 * This class extends a generic `Context.Tag` to provide a strongly-typed context for database transactions.
 *
 * @template TransactionContext - The type of the transaction context.
 * @template TransactionContextShape - The shape of the transaction context.
 *
 * @example
 * ```typescript
 * const transactionContext = { /* ... *\/ };
 * const effectWithTransaction = TransactionContext.provide(transactionContext)(someEffect);
 * ```
 */
export class TransactionContext extends Context.Tag('TransactionContext')<
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
 * Represents a DrizzleClient context tag for dependency injection.
 *
 * @template DrizzleClient - The type of the DrizzleClient.
 * @template T - The context value, containing:
 *   - `drizzle`: An instance of either `LibSQLDatabase` or `Database`.
 *   - `schema`: A record representing the database schema.
 *
 * This class is used to provide and consume a Drizzle database client and its schema
 * within a context-aware application, leveraging the Context.Tag utility for type safety.
 */
export class DrizzleClient extends Context.Tag('DrizzleClient')<
	DrizzleClient,
	{
		drizzle: LibSQLDatabase | Database;
		schema?: Record<string, unknown>;
	}
>() {}

/**
 * DrizzleDBClient is a service class that provides an interface for executing queries
 * and commands against a Drizzle ORM database instance within an Effect system.
 *
 * @remarks
 * This class extends `Effect.Service` and is registered under the service key `'DrizzleDBClient'`.
 * It exposes two main utilities:
 * - `execute`: A function to safely execute asynchronous operations on the Drizzle client,
 *   handling errors using `useWithErrorPromise`.
 * - `makeQuery`: A higher-order function to create effectful queries that can optionally
 *   participate in a transaction context if available.
 *
 * @example
 * ```typescript
 * const { makeQuery, execute } = yield* DrizzleDBClient;
 * const result = yield* makeQuery((exec, input) => exec( ... ));
 * ```
 */
export class DrizzleDBClientService extends Effect.Service<DrizzleDBClientService>()(
	'DrizzleDBClientService',
	{
		effect: Effect.gen(function* () {
			const { drizzle, schema = {} } = yield* DrizzleClient;

			/**
			 * Executes a provided asynchronous function with the `drizzle` client,
			 * wrapping the execution in `useWithErrorPromise` for error handling.
			 *
			 * @typeParam T - The return type of the asynchronous function.
			 * @param fn - An asynchronous function that receives the `drizzle` client and returns a Promise of type `T`.
			 * @returns An Effect that, when run, executes the provided function with the `drizzle` client and handles errors.
			 */
			const execute = Effect.fn(<T>(fn: (client: typeof drizzle) => Promise<T>) =>
				useWithErrorPromise(() => fn(drizzle))
			);

			/**
			 * Creates a query function that executes within an optional transaction context.
			 *
			 * @typeParam A - The type of the successful result of the effect.
			 * @typeParam E - The type of the error that the effect may produce.
			 * @typeParam R - The type of the required environment for the effect.
			 * @typeParam Input - The type of the input parameter for the query function.
			 *
			 * @param queryFn - A function that receives an `execute` function (or transaction context) and an input,
			 *                  returning an `Effect` representing the query operation.
			 *
			 * @returns A function that takes an input (if required) and returns an `Effect` that will execute the query,
			 *          using the current transaction context if available, or the default `execute` function otherwise.
			 *
			 * @example
			 * const getUserById = makeQuery((execute, id: number) =>
			 *   Effect.tryPromise(() => execute.users.findById(id))
			 * );
			 * const effect = getUserById(123);
			 */
			const makeQuery =
				<A, E, R, Input = never>(
					queryFn: (execute: ExecuteFn<typeof schema>, input: Input) => Effect.Effect<A, E, R>
				) =>
				(...args: [Input] extends [never] ? [] : [input: Input]): Effect.Effect<A, E, R> => {
					const input = args[0] as Input;
					return Effect.serviceOption(TransactionContext).pipe(
						Effect.map(Option.getOrNull),
						Effect.flatMap((txOrNull) => queryFn(txOrNull ?? execute, input))
					);
				};

			return { makeQuery, execute } as const;
		}),
	}
) {}

/**
 * Creates a live Drizzle database client effect with the provided configuration.
 *
 * @template Schema - The type of the schema object, extending a record of string keys to unknown values.
 * @param config - The configuration object for the Drizzle client.
 * @param config.drizzle - An instance of either `LibSQLDatabase` or `Database` to be used by the client.
 * @param [config.schema] - Optional schema definition for the database.
 * @returns An Effect that provides a Drizzle database client service, configured with the given parameters.
 */
export const drizzleDBClientLive = <Schema extends Record<string, unknown>>(config: {
	drizzle: LibSQLDatabase | Database;
	schema?: Schema;
}) =>
	DrizzleDBClientService.pipe(
		Effect.provide(DrizzleDBClientService.Default),
		Effect.provideService(DrizzleClient, DrizzleClient.of(config))
	);
