import { Context, Data, Effect, pipe } from 'effect';
import * as Schema from 'effect/Schema';
import { type Dialect, Kysely, NoResultError } from 'kysely';
import { type DatabaseError, NotFoundError, QueryError, QueryParseError } from './errors.js';

/**
 * Utility type to determine if a type includes null or undefined.
 */
type HasNullOrUndefined<T> = null extends T ? true : undefined extends T ? true : false;

/**
 * Utility type to remove never from object types at any depth.
 */
type OmitNever<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K];
};

/**
 * Utility type to recursively make properties that can be null or undefined optional,
 * while also processing nested objects and removing never types.
 */
export type OptionalNullable<T> = OmitNever<
	// Optional properties (nullable/undefined)
	{
		[K in keyof T as HasNullOrUndefined<T[K]> extends true ? K : never]?: T[K] extends object
			? // biome-ignore lint/suspicious/noExplicitAny: Dynamic BS
				T[K] extends any[]
				? T[K] // Don't recurse into arrays
				: OptionalNullable<T[K]> // Recurse into objects
			: T[K];
	} & {
		// Required properties (non-nullable)
		[K in keyof T as HasNullOrUndefined<T[K]> extends true ? never : K]: T[K] extends object
			? // biome-ignore lint/suspicious/noExplicitAny: Dynamic BS
				T[K] extends any[]
				? T[K] // Don't recurse into arrays
				: OptionalNullable<T[K]> // Recurse into objects
			: T[K];
	}
>;

/**
 * Type alias for an Effect-wrapped database operation that accepts a Kysely instance and returns a result.
 *
 * This type represents a higher-order function that takes a callback function as an argument.
 * The callback function receives a Kysely<Schema> instance and returns a Promise of type T.
 * The outer function returns an Effect that, when executed, yields another Effect.
 * The inner Effect resolves to the result of type T or fails with one of the specified error types.
 *
 * Type Parameters:
 * - Schema: The Kysely schema type representing the database structure.
 * - T: The type of the result produced by the callback function.
 *
 * Error Types:
 * - NotFoundError: Indicates that a requested resource was not found in the database.
 * - QueryError: Represents errors that occur during query execution.
 * - DBCallbackFailure: Represents failures that occur within the database callback function.
 */
export type EffectDb<Schema> = <T>(
	fn: (db: Kysely<Schema>) => Promise<T>
) => Effect.Effect.AsEffect<
	Effect.Effect<
		T,
		NotFoundError | QueryError | NotFoundError | QueryError | DBCallbackFailure,
		never
	>
>;

/**
 * Type alias for an asynchronous query function that accepts input and returns a Promise of output.
 *
 * This type represents a function that takes an input of type I and returns a Promise
 * that resolves to a value of type O. It is commonly used to define database query functions
 * that perform asynchronous operations.
 *
 * Type Parameters:
 * - I: The type of the input parameter accepted by the query function.
 * - O: The type of the output value produced by the query function.
 */
export type QueryFn<I, O> = (input: I) => Promise<O>;

/**
 * Custom error class representing a failure that occurs within a database callback function.
 *
 * This error is tagged with 'DBCallbackFailure' and includes a cause property
 * that holds the underlying reason for the failure.
 */
export class DBCallbackFailure extends Data.TaggedError('DBCallbackFailure')<{ cause: unknown }> {}

/**
 * Type alias for an Effect-wrapped database operation that accepts a Kysely instance and returns a result.
 *
 * This type represents a higher-order function that takes a callback function as an argument.
 * The callback function receives a Kysely<Schema> instance and returns a Promise of type T.
 * The outer function returns an Effect that, when executed, yields another Effect.
 * The inner Effect resolves to the result of type T or fails with one of the specified error types.
 *
 * Type Parameters:
 * - Schema: The Kysely schema type representing the database structure.
 * - T: The type of the result produced by the callback function.
 *
 * Error Types:
 * - NotFoundError: Indicates that a requested resource was not found in the database.
 * - QueryError: Represents errors that occur during query execution.
 * - DBCallbackFailure: Represents failures that occur within the database callback function.
 */
type DBCallback<Schema> = <T>(
	fn: (db: Kysely<Schema>) => Promise<T>
) => Effect.Effect.AsEffect<
	Effect.Effect<T, NotFoundError | QueryError | DBCallbackFailure, never>
>;

/**
 * Type alias for a function that performs a database operation using a Kysely instance and input data.
 *
 * This type represents a higher-order function that takes a DBCallback and an input of type I,
 * and returns an Effect that, when executed, yields a result of type O or fails with one of the specified error types.
 *
 * Type Parameters:
 * - Schema: The Kysely schema type representing the database structure.
 * - I: The type of the input parameter accepted by the function.
 * - O: The type of the output value produced by the function.
 *
 * Error Types:
 * - NotFoundError: Indicates that a requested resource was not found in the database.
 * - QueryError: Represents errors that occur during query execution.
 * - DBCallbackFailure: Represents failures that occur within the database callback function.
 */
type DBCallbackFn<Schema, I, O> = (
	query: DBCallback<Schema>,
	input: I
) => Effect.Effect<O, NotFoundError | QueryError | DBCallbackFailure, never>;

/**
 * Base interface for a database client providing access to the Kysely instance and effectful operations.
 *
 * Type Parameters:
 * - Schema: The Kysely schema type representing the database structure.
 */
interface DBClientBase<Schema> {
	readonly db: Kysely<Schema>;
	readonly effectDb: DBCallback<Schema>;
}

/**
 * Interface defining codec-based helpers for database operations.
 *
 * This interface provides methods to create Effect-wrapped database operations that
 * utilize encoding and decoding schemas for input and output data transformations.
 *
 * Type Parameters:
 * - Schema: The Kysely schema type representing the database structure.
 *
 * Methods:
 * - withEncoder: Creates a function that encodes input data before executing a database operation.
 * - withDecoder: Creates a function that decodes output data after executing a database operation.
 * - withCodec: Creates a function that both encodes input data and decodes output data around a database operation.
 */
interface DBCodecs<Schema> {
	/**
	 * Creates a function that encodes input data before executing a database operation.
	 *
	 * @typeParam IEncoded - The encoded representation produced by the encoder schema.
	 * @typeParam IType - The input value type accepted by the encoder schema.
	 * @typeParam O - The output type produced by the database operation.
	 * @typeParam CIType - The cleaned input type with `never` properties stripped (optional).
	 *
	 * @param params.encoder - A schema capable of encoding IType to IEncoded.
	 * @param params.callbackFn - A function that performs the database operation using the encoded input.
	 *
	 * @returns A function that accepts input of type CIType and returns an Effect yielding O or failing with DatabaseError.
	 */
	readonly withEncoder: <IEncoded, IType, O, CIType = OptionalNullable<IType>>({
		callbackFn,
		encoder,
	}: {
		encoder: Schema.Schema<IType, IEncoded>;
		callbackFn: DBCallbackFn<Schema, IEncoded, O>;
	}) => (
		input: CIType
	) => Effect.Effect<O, DatabaseError | NotFoundError | QueryError | DBCallbackFailure, never>;

	/**
	 * Creates a function that decodes output data after executing a database operation.
	 *
	 * @typeParam OEncoded - The encoded/input representation accepted by the decoder schema.
	 * @typeParam OType - The target/decoded output type produced by the decoder schema.
	 *
	 * @param params.decoder - A schema used to decode OEncoded into OType.
	 * @param params.callbackFn - A function that performs the database operation and returns encoded output.
	 *
	 * @returns A zero-argument function that returns an Effect yielding OType or failing with DatabaseError.
	 */
	readonly withDecoder: <OEncoded, OType>({
		decoder,
		callbackFn,
	}: {
		decoder: Schema.Schema<OType, OEncoded, never>;
		callbackFn: DBCallbackFn<Schema, undefined, OEncoded>;
	}) => () => Effect.Effect<
		OType,
		DatabaseError | NotFoundError | QueryError | DBCallbackFailure,
		never
	>;

	/**
	 * Creates a function that both encodes input data and decodes output data around a database operation.
	 *
	 * @typeParam IEncoded - The encoded representation produced by the encoder schema.
	 * @typeParam IType - The input value type accepted by the encoder schema.
	 * @typeParam OEncoded - The encoded/input representation accepted by the decoder schema.
	 * @typeParam OType - The target/decoded output type produced by the decoder schema.
	 * @typeParam CIType - The cleaned input type with `never` properties stripped (optional).
	 *
	 * @param params.encoder - A schema capable of encoding IType to IEncoded.
	 * @param params.decoder - A schema used to decode OEncoded into OType.
	 * @param params.callbackFn - A function that performs the database operation using the encoded input and returns encoded output.
	 *
	 * @returns A function that accepts input of type CIType and returns an Effect yielding OType or failing with DatabaseError.
	 */
	readonly withCodec: <IEncoded, IType, OEncoded, OType, CIType = OptionalNullable<IType>>({
		encoder,
		decoder,
		callbackFn,
	}: {
		encoder: Schema.Schema<IType, IEncoded, never>;
		decoder: Schema.Schema<OType, OEncoded, never>;
		callbackFn: DBCallbackFn<Schema, IEncoded, OEncoded>;
	}) => (
		input: CIType
	) => Effect.Effect<OType, DatabaseError | NotFoundError | QueryError | DBCallbackFailure, never>;
}

/**
 * Comprehensive interface for a database client combining base functionality and codec-based helpers.
 *
 * Type Parameters:
 * - Schema: The Kysely schema type representing the database structure.
 */
export interface DBClientInterface<Schema> extends DBClientBase<Schema>, DBCodecs<Schema> {}

/**
 * Type alias for an Effect that yields a Kysely database client for the specified schema.
 *
 * This type represents an Effect that, when executed, provides a Kysely<Schema> instance.
 * The Effect requires a DBClientInterface<Schema> as its environment and does not fail.
 *
 * Type Parameters:
 * - Schema: The Kysely schema type representing the database structure.
 */
export type KyselyDBClientRaw<Schema> = Effect.Effect<
	DBClientInterface<Schema>,
	never,
	Kysely<Schema>
>;

/**
 * Type alias for an Effect that provides a live Kysely database client for the specified schema.
 *
 * This type represents an Effect that, when executed, yields no value but requires
 * a DBClientInterface<Schema> as its environment. It is used to set up and provide
 * a live Kysely client instance in the Effect context.
 *
 * Type Parameters:
 * - Schema: The Kysely schema type representing the database structure.
 */
export type KyselyDBClientLive<Schema> = Effect.Effect<DBClientInterface<Schema>, never, never>;

/**
 * Encode a value using the provided schema and normalize schema parse errors into QueryParseError.
 *
 * Type parameters:
 * - IEncoded: The encoded representation produced by the schema.
 * - IType: The input value type accepted by the schema.
 *
 * Parameters:
 * - inputSchema: A schema capable of encoding IType to IEncoded.
 * - input: The value to encode.
 *
 * Returns:
 * - An Effect that yields the encoded value (IEncoded) on success, or fails with a QueryParseError
 *   wrapping the underlying schema parse error on failure.
 *
 * Notes:
 * - This function delegates encoding to the schema's encode function and maps any schema parse
 *   errors to QueryParseError to provide a consistent error type for callers.
 */
const encode = <IEncoded, IType>(inputSchema: Schema.Schema<IType, IEncoded>, input: IType) =>
	pipe(
		input,
		Schema.encode(inputSchema),
		Effect.mapError((parseError) => new QueryParseError({ parseError }))
	);

/**
 * Decode a value using the provided schema and convert decoding failures into a QueryParseError.
 *
 * @typeParam OEncoded - The encoded/input representation accepted by the schema.
 * @typeParam OType - The target/decoded output type produced by the schema.
 * @param outputSchema - The schema used to decode `encoded` from `OEncoded` to `OType`.
 * @param encoded - The value to decode.
 * @returns An Effect that resolves to the decoded value of type `OType` on success, or fails with a {@link QueryParseError}
 *          that wraps the underlying parse error when decoding fails.
 *
 * @remarks
 * This helper pipes `encoded` through the schema decoder and maps any parse errors to a `QueryParseError`
 * so callers receive a consistent error type for schema validation failures.
 */
const decode = <OEncoded, OType>(outputSchema: Schema.Schema<OType, OEncoded>, encoded: OEncoded) =>
	pipe(
		encoded,
		Schema.decode(outputSchema),
		Effect.mapError((parseError) => new QueryParseError({ parseError }))
	);

/**
 * Wraps an asynchronous query function in an Effect that captures its result or maps thrown values
 * to well-typed domain errors.
 *
 * @template I - Type of the input passed to the query function.
 * @template O - Type of the output resolved by the query function.
 * @param query - An async function that accepts an input of type I and returns a Promise<O>.
 * @param input - The input value to supply to the query when the effect is executed.
 * @returns An Effect that, when executed, will:
 *   - resolve with the query's result (O) if the promise fulfills, or
 *   - fail with:
 *     - NotFoundError when the original error is a NoResultError,
 *     - QueryError containing the original Error.message when the original error is an Error,
 *     - QueryError containing String(error) for any other thrown value.
 *
 * Notes:
 * - The Effect is created using Effect.tryPromise, so execution is deferred until the Effect is run.
 * - This function standardizes error shapes for upstream consumers of the Effect.
 */
const toEffect = <I, O>(query: QueryFn<I, O>, input: I) =>
	Effect.tryPromise({
		try: () => query(input),
		/* v8 ignore start */
		catch: (error) => {
			if (error instanceof NoResultError) {
				return new NotFoundError();
			}

			if (error instanceof Error) {
				return new QueryError({ message: error.message });
			}

			return new QueryError({ message: String(error) });
		},
		/* v8 ignore stop */
	});

/**
 * Creates a strongly-typed context tag for a Kysely client bound to a specific database schema.
 *
 * The returned Context.GenericTag can be used as a unique key for registering or retrieving
 * a Kysely instance from a dependency-injection or context system while preserving the
 * compile-time schema information provided via the generic parameter.
 *
 * @template Schema - The Kysely schema type that describes the database tables and columns.
 * @returns Context.GenericTag<Kysely<Schema>> — a tag identifying the Kysely client instance for the given schema.
 */
export const kyselyClient = <Schema>() =>
	Context.GenericTag<Kysely<Schema>>('@withstudiocms/kysely/KyselyClient');

/**
 * Factory function to create a Kysely database client for the specified schema and SQL dialect.
 *
 * @template Schema - The database schema type used by the Kysely client.
 * @param dialect - The SQL dialect implementation to use with Kysely (e.g., PostgresDialect, MysqlDialect).
 * @returns A Kysely<Schema> instance configured with the provided dialect.
 *
 * @example
 * ```ts
 * export const makeDBClientLive = <Schema>(dialect: Dialect) =>
 *   dbClient<Schema>().pipe(
 *     Effect.provideService(kyselyClient<Schema>(), makeKyselyClient(dialect))
 *   );
 * ```
 */
const makeKyselyClient = <Schema>(dialect: Dialect) => {
	const db = new Kysely<Schema>({
		dialect,
	});
	return db;
};

///

/**
 * Create a typed database client wrapped in Effect-based helpers.
 *
 * This factory returns an Effect that, when executed, yields an object containing:
 * - db: a helper to run arbitrary asynchronous operations against the underlying Kysely instance as an Effect.
 * - withEncoder: a helper that accepts a codec (encoder) and a query function that expects encoded input; it returns a function that
 *   accepts the decoded input, encodes it, and runs the query, returning an Effect with the query result or a DatabaseError.
 * - withDecoder: a helper that accepts a codec (decoder) and a query function that returns encoded output as an Effect; it returns
 *   a zero-argument function that runs the query and decodes the result, returning an Effect with the decoded output or a DatabaseError.
 * - withCodec: a combined helper that accepts both encoder and decoder and a query function that accepts encoded input and returns
 *   encoded output; it returns a function that accepts decoded input, encodes it, runs the query, decodes the result, and yields
 *   the decoded output as an Effect or a DatabaseError.
 *
 * The returned value is an Effect generator (Effect.Effect) that encapsulates creation of the underlying Kysely client
 * (via kyselyClient) and wiring of the helper functions. All operations exposed by the helpers return Effect.Effect values
 * and therefore are lazy until executed by the Effect runtime.
 */
const dbClient = <Schema>(): KyselyDBClientRaw<Schema> =>
	Effect.gen(function* () {
		const db = yield* kyselyClient<Schema>();

		/**
		 * Effect-wrapped helper that runs an asynchronous operation against the shared Kysely<Schema> instance.
		 *
		 * This utility accepts a callback which receives the configured Kysely<Schema> client (rawDB)
		 * and returns a Promise of some result. The callback is converted into an Effect via `toEffect`,
		 * ensuring the provided operation runs with the same underlying database client inside the Effect system.
		 *
		 * @remarks
		 * - Errors thrown or rejected inside the callback are propagated through the returned Effect.
		 * - Use this helper to perform database operations in a composable Effect-based workflow while reusing the configured `rawDB`.
		 *
		 * @example
		 * const effect = db((client) => client.selectFrom('users').selectAll().execute());
		 */
		const effectDb: EffectDb<Schema> = Effect.fn(<T>(fn: (db: Kysely<Schema>) => Promise<T>) =>
			toEffect(fn, db)
		);

		/**
		 * Creates a helper that encodes a plain input object and executes a query with the encoded value, returning an effectful result.
		 *
		 * This higher-order function accepts an encoder schema and a query function. It returns a new function that:
		 * - accepts a cleaned input object (CIType — i.e., IType with `never` properties stripped),
		 * - encodes the input to the wire/storage shape (IEncoded) using the provided schema,
		 * - invokes the provided query function with the encoded value,
		 * - and returns the resulting Effect which may fail with a DatabaseError or succeed with a value of type O.
		 *
		 * The returned function performs encoding and query execution inside the Effect/IO context; no synchronous throws are expected.
		 *
		 * @param options.encoder - A schema implementing S.Schema<IType, IEncoded> used to encode the input before running the query.
		 * @param options.query - A function that accepts the encoded value (IEncoded) and returns an Effect that yields O or fails with DatabaseError.
		 *
		 * @returns A function that accepts input: CIType and returns Effect.Effect<O, DatabaseError>. The effect encodes the input and runs the query inside the Effect runtime.
		 */
		const withEncoder: DBCodecs<Schema>['withEncoder'] =
			<IEncoded, IType, O, CIType = OptionalNullable<IType>>({
				callbackFn,
				encoder,
			}: {
				encoder: Schema.Schema<IType, IEncoded>;
				callbackFn: (
					query: typeof effectDb,
					input: IEncoded
				) => Effect.Effect<O, DatabaseError | NotFoundError | QueryError | DBCallbackFailure>;
			}) =>
			(input: CIType) =>
				Effect.gen(function* () {
					const encoded = yield* encode(encoder, input as unknown as IType);
					return yield* callbackFn(effectDb, encoded);
				});

		/**
		 * Create an effectful operation that runs a query and decodes its result.
		 *
		 * @template OEncoded - The encoded/transport representation returned by the query (e.g. raw DB row).
		 * @template OType - The target decoded TypeScript type produced by the provided schema.
		 *
		 * @param options.decoder - A schema (e.g. io-ts, zod-like or internal Schema) that can decode/validate the query result
		 *                          from OEncoded into OType. If decoding fails, the resulting effect fails with a decoding error
		 *                          (wrapped as a DatabaseError).
		 * @param options.query - A parameterless query function (QueryFn<undefined, OEncoded>) that when executed produces
		 *                         an OEncoded value inside an Effect. Any error raised by the query is surfaced as a DatabaseError.
		 *
		 * @returns A zero-argument function which, when invoked, returns an Effect that:
		 *          - executes the provided query,
		 *          - attempts to decode the query result using the provided schema,
		 *          - on success yields the decoded OType value,
		 *          - on failure fails with a DatabaseError (either from the query or from decoding).
		 *
		 * @example
		 * const run = withDecoder({ decoder: userSchema, query: fetchUserRow });
		 * const effect = run(); // Effect< userType, DatabaseError >
		 */
		const withDecoder: DBCodecs<Schema>['withDecoder'] =
			<OEncoded, OType>({
				decoder,
				callbackFn,
			}: {
				decoder: Schema.Schema<OType, OEncoded>;
				callbackFn: (
					query: typeof effectDb,
					input: undefined
				) => Effect.Effect<
					OEncoded,
					DatabaseError | NotFoundError | QueryError | DBCallbackFailure
				>;
			}) =>
			(): Effect.Effect<OType, DatabaseError | NotFoundError | QueryError | DBCallbackFailure> =>
				Effect.gen(function* () {
					const res = yield* callbackFn(effectDb, undefined);
					return yield* decode(decoder, res);
				});

		/**
		 * Creates a codec-wrapped query function that composes an encoder, a query, and a decoder into a single Effectful operation.
		 *
		 * @param params - An object containing the encoder, decoder and query.
		 * @param params.encoder - Schema that encodes values of IType into IEncoded.
		 * @param params.decoder - Schema that decodes values of OEncoded into OType.
		 * @param params.query - Function that accepts IEncoded and returns an Effect producing OEncoded (or failing with DatabaseError).
		 *
		 * @returns A function which accepts an input of type CIType and returns an Effect that yields OType or fails with DatabaseError.
		 *
		 * @remarks
		 * The returned function executes the following steps in sequence:
		 * 1. Encode the provided input using the `encoder` schema.
		 * 2. Run the `query` with the encoded value to obtain an encoded response.
		 * 3. Decode the response using the `decoder` schema and return the resulting OType.
		 *
		 * Failures propagated by the returned Effect may include:
		 * - Encoding/decoding validation errors from the provided schemas.
		 * - Database/query errors emitted by the `query` Effect (DatabaseError).
		 *
		 * @example
		 * const getUser = withCodec({
		 *   encoder: UserIdSchema,
		 *   decoder: UserSchema,
		 *   query: (encoded) => db.queryUser(encoded),
		 * });
		 *
		 * // getUser returns Effect<User, DatabaseError>
		 * const effect = getUser({ id: 'abc' });
		 */
		const withCodec: DBCodecs<Schema>['withCodec'] =
			<IEncoded, IType, OEncoded, OType, CIType = OptionalNullable<IType>>({
				encoder,
				decoder,
				callbackFn,
			}: {
				encoder: Schema.Schema<IType, IEncoded>;
				decoder: Schema.Schema<OType, OEncoded>;
				callbackFn: (
					query: typeof effectDb,
					input: IEncoded
				) => Effect.Effect<
					OEncoded,
					DatabaseError | NotFoundError | QueryError | DBCallbackFailure
				>;
			}) =>
			(
				input: CIType
			): Effect.Effect<OType, DatabaseError | NotFoundError | QueryError | DBCallbackFailure> =>
				Effect.gen(function* () {
					const encoded = yield* encode(encoder, input as unknown as IType);
					const res = yield* callbackFn(effectDb, encoded);
					return yield* decode(decoder, res);
				});

		return {
			db,
			effectDb,
			withCodec,
			withDecoder,
			withEncoder,
		} as DBClientInterface<Schema>;
	});

/**
 * Provides a live implementation of the Kysely database client for StudioCMS.
 *
 * This function creates and configures a Kysely client using the provided SQL dialect
 * and makes it available as a service in the Effect context. It is intended to be used
 * in the application layer to set up database access.
 *
 * @param dialect - The SQL dialect implementation to use with Kysely (e.g., PostgresDialect, MysqlDialect).
 * @returns An Effect that provides the Kysely client for the StudioCMS database schema.
 *
 * @example
 * ```ts
 * import { makeDBClientLive } from '@withstudiocms/kysely';
 * import { PostgresDialect } from 'kysely-postgres';
 *
 * const dbEffect = makeDBClientLive(new PostgresDialect({
 *   // connection config
 * }));
 * ```
 */
export const makeDBClientLive = <Schema>(dialect: Dialect): KyselyDBClientLive<Schema> =>
	dbClient<Schema>().pipe(Effect.provideService(kyselyClient<Schema>(), makeKyselyClient(dialect)));
