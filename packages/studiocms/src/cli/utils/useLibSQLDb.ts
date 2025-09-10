import { createClient, type ResultSet } from '@libsql/client';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as s from 'drizzle-orm/sqlite-core';
import { Context, Data, Effect, Option } from 'effect';

export const Users = s.sqliteTable('StudioCMSUsers', {
	id: s.text('id').primaryKey(),
	url: s.text('url'),
	name: s.text('name').notNull(),
	email: s.text('email').unique(),
	avatar: s.text('avatar').default('https://seccdn.libravatar.org/static/img/mm/80.png'),
	username: s.text('username').notNull(),
	password: s.text('password'),
	updatedAt: s.integer('updatedAt', { mode: 'timestamp' }),
	createdAt: s.integer('createdAt', { mode: 'timestamp' }),
	emailVerified: s.integer('emailVerified', { mode: 'boolean' }).default(false).notNull(),
	notifications: s.text('notifications'),
});

export const Permissions = s.sqliteTable('StudioCMSPermissions', {
	user: s
		.text('user')
		.references(() => Users.id)
		.notNull(),
	rank: s.text('rank', { enum: ['owner', 'admin', 'editor', 'visitor', 'unknown'] }).notNull(),
});

/**
 * Returns a new Drizzle libSQL connection.
 *
 * @deprecated Use `libSQLDrizzleClient` instead, which provides better error handling and Effect integration.
 */
export const useLibSQLDb = (url: string, authToken: string) => {
	try {
		const client = createClient({ url, authToken });
		const db = drizzle(client, {
			schema: {
				StudioCMSUsers: Users,
				StudioCMSPermissions: Permissions,
			},
		});

		return db;
	} catch (error) {
		console.error('Failed to connect to libSQL database:', error);
		throw new Error('Database connection failed. Please check your credentials and try again.');
	}
};

export class LibSQLClientError extends Data.TaggedError('LibSQLClientError')<{ cause: unknown }> {}

const useWithError = <A>(_try: () => A) =>
	Effect.try({
		try: _try,
		catch: (cause) => new LibSQLClientError({ cause }),
	});

const useWithErrorPromise = <A>(_try: () => Promise<A>) =>
	Effect.tryPromise({
		try: _try,
		catch: (cause) => new LibSQLClientError({ cause }),
	});

const drizzleConfig = {
	schema: {
		StudioCMSUsers: Users,
		StudioCMSPermissions: Permissions,
	},
};

type Schema = (typeof drizzleConfig)['schema'];

export type TransactionClient = s.SQLiteTransaction<
	'async',
	ResultSet,
	Record<string, never>,
	ExtractTablesWithRelations<Record<string, never>>
>;

export type ExecuteFn<Schema extends Record<string, unknown>> = <T>(
	fn: (client: LibSQLDatabase<Schema> | TransactionClient) => Promise<T>
) => Effect.Effect<T, LibSQLClientError>;

export type TransactionContextShape = <U>(
	fn: (client: TransactionClient) => Promise<U>
) => Effect.Effect<U, LibSQLClientError>;

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
 * Creates a Drizzle client for a LibSQL database and provides utility functions for executing queries.
 *
 * @param url - The URL of the LibSQL database.
 * @param authToken - The authentication token for the LibSQL database.
 * @returns An object containing:
 *   - `execute`: A function to execute a query with error handling, wrapping the result in an Effect.
 *   - `makeQuery`: A higher-order function to create typed query functions that can optionally use a transaction context.
 *
 * @example
 * const { execute, makeQuery } = yield* libSQLDrizzleClient(url, authToken);
 * const result = yield* execute((db) => db.select(...));
 */
export const libSQLDrizzleClient = Effect.fn(function* (url: string, authToken: string) {
	const client = yield* useWithError(() => createClient({ url, authToken }));
	const db = yield* useWithError(() => drizzle(client, drizzleConfig));

	/**
	 * Executes a provided asynchronous function with a `LibSQLDatabase` client within an Effect context.
	 *
	 * Wraps the function execution in an `Effect.tryPromise`, converting any thrown errors into a `LibSQLClientError`.
	 *
	 * @typeParam T - The return type of the provided function.
	 * @param fn - An asynchronous function that receives a `LibSQLDatabase<Schema>` client and returns a `Promise<T>`.
	 * @returns An `Effect` that resolves to the result of the function or fails with a `LibSQLClientError` if an error occurs.
	 */
	const execute = Effect.fn(<T>(fn: (client: LibSQLDatabase<Schema>) => Promise<T>) =>
		useWithErrorPromise(() => fn(db))
	);

	/**
	 * Creates a query function that automatically injects the current transaction context (if available)
	 * or falls back to the default `execute` function. The returned function adapts its input signature
	 * based on whether the `Input` type is `never` (no arguments) or a specific type (single argument).
	 *
	 * @typeParam A - The success type of the Effect.
	 * @typeParam E - The error type of the Effect.
	 * @typeParam R - The environment type required by the Effect.
	 * @typeParam Input - The input type for the query function. If `never`, the returned function takes no arguments.
	 *
	 * @param queryFn - A function that receives the current transaction context or execute function, and the input,
	 *                  returning an Effect.
	 * @returns A function that, when called with the appropriate input, returns an Effect that executes the query
	 *          within the current transaction context if available.
	 */
	const makeQuery =
		<A, E, R, Input = never>(
			queryFn: (execute: ExecuteFn<Schema>, input: Input) => Effect.Effect<A, E, R>
		) =>
		(...args: [Input] extends [never] ? [] : [input: Input]): Effect.Effect<A, E, R> => {
			const input = args[0] as Input;
			return Effect.serviceOption(TransactionContext).pipe(
				Effect.map(Option.getOrNull),
				Effect.flatMap((txOrNull) => queryFn(txOrNull ?? execute, input))
			);
		};

	return { execute, makeQuery };
});
