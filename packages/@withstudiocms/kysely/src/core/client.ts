import * as S from '@effect/schema/Schema';
import { Context, Effect, pipe } from 'effect';
import { type Dialect, Kysely, NoResultError } from 'kysely';
import { type DatabaseError, NotFoundError, QueryError, QueryParseError } from './errors.js';

/**
 * Represents an asynchronous query function.
 *
 * The function receives an input of type `I` and returns a `Promise` resolving to `O`.
 * Implementations typically perform I/O (e.g., database or network) and may reject
 * with an error if the operation fails.
 *
 * @template I - Type of the input argument provided to the query function.
 * @template O - Type of the resolved value returned by the Promise.
 *
 * @example
 * // QueryFn<{ id: string }, User>
 * const getUser: QueryFn<{ id: string }, User> = async (input) => { ... };
 *
 * @throws Any error encountered during execution (e.g., network or DB errors).
 */
type QueryFn<I, O> = (input: I) => Promise<O>;

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
const encode = <IEncoded, IType>(inputSchema: S.Schema<IType, IEncoded>, input: IType) =>
	pipe(
		input,
		S.encode(inputSchema),
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
const decode = <OEncoded, OType>(outputSchema: S.Schema<OType, OEncoded>, encoded: OEncoded) =>
	pipe(
		encoded,
		S.decode(outputSchema),
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
		catch: (error) => {
			if (error instanceof NoResultError) {
				return new NotFoundError();
			}

			if (error instanceof Error) {
				return new QueryError({ message: error.message });
			}

			return new QueryError({ message: String(error) });
		},
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

/**
 * Represents a helper that runs an asynchronous database operation inside an effect.
 *
 * @template Schema - The database schema type used by the Kysely client supplied to the callback.
 * @template T - The result type produced by the provided callback; this becomes the success value of the returned Effect.
 *
 * @param fn - A callback that receives a Kysely instance typed with Schema and performs asynchronous queries,
 *             returning a Promise that resolves to a value of type T. Any errors thrown by this callback or by
 *             the underlying database client that correspond to QueryError or NotFoundError will be surfaced
 *             through the Effect's error channel.
 *
 * @returns An Effect that, when executed, runs the provided callback with a Kysely<Schema> instance and yields
 *          the callback's resolved value T on success. Failures are represented as QueryError | NotFoundError.
 *
 * @remarks
 * - Use this type to encapsulate database access within an effectful workflow and centralize error handling.
 * - The implementation is expected to map/convert database exceptions into the declared error union so callers
 *   can handle them in the effect system.
 *
 * @example
 * // Example usage (illustrative):
 * // const runQuery: EffectDB<MySchema> = async (db) => { return await db.selectFrom('users').selectAll().execute(); }
 */
type EffectDB<Schema> = <T>(
	fn: (db: Kysely<Schema>) => Promise<T>
) => Effect.Effect<T, QueryError | NotFoundError, never>;

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
const dbClient = <Schema>() =>
	Effect.gen(function* () {
		const rawDB = yield* kyselyClient<Schema>();

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
		 * const effect = db((client) => {
		 *   return client.selectFrom('users').selectAll().execute();
		 * });
		 */
		const db = Effect.fn(<T>(fn: (db: Kysely<Schema>) => Promise<T>) => toEffect(fn, rawDB));

		/**
		 * Compose an encoder and a database query into an effectful operation.
		 *
		 * This higher-order helper accepts an encoder and a query function and returns a new function
		 * that:
		 *  - encodes a value of type IType into IEncoded using the provided schema encoder,
		 *  - invokes the provided query with the encoded value and the surrounding database handle,
		 *  - returns the resulting effect that yields O on success or fails with DatabaseError.
		 *
		 * @param params.encoder - A schema encoder of type S.Schema<IType, IEncoded> used to transform the external input into the encoded form.
		 * @param params.query - A function (db: EffectDB<Schema>, input: IEncoded) => Effect.Effect<O, DatabaseError> that performs the database operation using the encoded input.
		 *
		 * @returns A function that takes an input of type IType and returns Effect.Effect<O, DatabaseError>.
		 *          The returned effect will fail if encoding fails or if the query effect fails.
		 *
		 * @remarks
		 * - The returned function closes over an external EffectDB<Schema> instance (named `db`) which is supplied to the provided query.
		 * - Encoding failures and query failures are surfaced as DatabaseError in the effect's error channel.
		 *
		 * @example
		 * const findByKey = withEncoder({
		 *   encoder: keySchema,
		 *   query: (db, encodedKey) => queryByKey(db, encodedKey),
		 * });
		 *
		 * // use:
		 * const effect = findByKey({ id: 'abc' }); // returns Effect.Effect<ResultType, DatabaseError>
		 */
		const withEncoder =
			<IEncoded, IType, O>({
				encoder,
				query,
			}: {
				encoder: S.Schema<IType, IEncoded>;
				query: (db: EffectDB<Schema>, input: IEncoded) => Effect.Effect<O, DatabaseError>;
			}) =>
			(input: IType): Effect.Effect<O, DatabaseError> =>
				Effect.gen(function* () {
					const encoded = yield* encode(encoder, input);
					return yield* query(db, encoded);
				});

		/**
		 * Create a lazy effect that runs a database query and decodes its result.
		 *
		 * @param options.decoder - A schema/decoder that knows how to convert OEncoded into OType.
		 * @param options.query - A function that receives the ambient database handle and
		 *   returns an effect producing the encoded result (OEncoded) or a DatabaseError.
		 *
		 * @returns A zero-argument effect which, when executed, runs the provided query
		 *   against the captured database handle, then decodes the query result with the
		 *   provided schema and yields the decoded value (OType). Any DatabaseError raised
		 *   by the query or by decoding is propagated.
		 *
		 * @remarks
		 * - The returned effect is lazy: nothing runs until the effect is executed.
		 * - Errors may come from the query itself or from the decoding step.
		 */
		const withDecoder =
			<OEncoded, OType>({
				decoder,
				query,
			}: {
				decoder: S.Schema<OType, OEncoded>;
				query: (db: EffectDB<Schema>) => Effect.Effect<OEncoded, DatabaseError>;
			}) =>
			(): Effect.Effect<OType, DatabaseError> =>
				Effect.gen(function* () {
					const res = yield* query(db);
					return yield* decode(decoder, res);
				});

		/**
		 * Composes an encoder, a decoder and an effectful query into a single, strongly-typed operation.
		 *
		 * @param options.encoder - Schema used to encode a value of IType into IEncoded.
		 * @param options.decoder - Schema used to decode a value of OEncoded into OType.
		 * @param options.query - Effectful function that performs the database operation. It receives an EffectDB<Schema>
		 *                         and an encoded input (IEncoded) and returns an Effect that yields OEncoded or fails with DatabaseError.
		 *
		 * @returns A function that accepts an input of IType and returns an Effect.Effect<OType, DatabaseError>. When run, the
		 *          resulting effect will:
		 *            1. Encode the provided input using the supplied encoder.
		 *            2. Invoke the provided query with the encoded input against the captured `db` instance.
		 *            3. Decode the query result using the supplied decoder and yield the decoded OType.
		 *
		 * @remarks
		 * - The implementation composes the three steps in sequence using Effect.gen (i.e. monadic sequencing).
		 * - Any failure during encode, query, or decode is represented by DatabaseError and will cause the returned Effect to fail.
		 * - The function closes over a surrounding `db: EffectDB<Schema>` instance; callers do not pass the DB directly to the returned function.
		 *
		 * @example
		 * // Conceptual usage:
		 * // const op = withCodec({ encoder, decoder, query });
		 * // const effect = op(userInput); // Effect<Either<OType, DatabaseError>>
		 */
		const withCodec =
			<IEncoded, IType, OEncoded, OType>({
				encoder,
				decoder,
				query,
			}: {
				encoder: S.Schema<IType, IEncoded>;
				decoder: S.Schema<OType, OEncoded>;
				query: (db: EffectDB<Schema>, input: IEncoded) => Effect.Effect<OEncoded, DatabaseError>;
			}) =>
			(input: IType): Effect.Effect<OType, DatabaseError> =>
				Effect.gen(function* () {
					const encoded = yield* encode(encoder, input);
					const res = yield* query(db, encoded);
					return yield* decode(decoder, res);
				});

		return {
			$: rawDB,
			db,
			withEncoder,
			withDecoder,
			withCodec,
		} as const;
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
export const makeDBClientLive = <Schema>(dialect: Dialect) =>
	dbClient<Schema>().pipe(Effect.provideService(kyselyClient<Schema>(), makeKyselyClient(dialect)));
