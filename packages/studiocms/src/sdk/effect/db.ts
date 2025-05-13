import { db as client } from 'astro:db';
import type { Database as Client } from '@astrojs/db/runtime';
import { LibsqlError, type ResultSet } from '@libsql/client';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { Cause, Context, Data, Effect, Exit, Option, Runtime } from 'effect';

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
	readonly cause: LibsqlError;
}> {
	public override toString() {
		return `DatabaseError: ${this.cause.message}`;
	}

	public get message() {
		return this.cause.message;
	}
}

export const LibSQLmatchClientError = (error: unknown) => {
	if (error instanceof LibsqlError) {
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

export type TransactionClient = SQLiteTransaction<
	'async',
	ResultSet,
	Record<string, never>,
	ExtractTablesWithRelations<Record<string, never>>
>;

export type TransactionContextShape = <U>(
	fn: (client: TransactionClient) => Promise<U>
) => Effect.Effect<U, LibSQLDatabaseError>;

export type ExecuteFn = <T>(
	fn: (client: Client | TransactionClient) => Promise<T>
) => Effect.Effect<T, LibSQLDatabaseError>;

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

export class AstroDB extends Effect.Service<AstroDB>()('studiocms/sdk/effect/db/AstroDB', {
	effect: Effect.gen(function* () {
		const db = client;

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

		const transaction = Effect.fn('studiocms/sdk/effect/db/Database.transaction')(
			<T, E, R>(txExecute: (tx: TransactionContextShape) => Effect.Effect<T, E, R>) =>
				Effect.runtime<R>().pipe(
					Effect.map((runtime) => Runtime.runPromiseExit(runtime)),
					Effect.flatMap((runPromiseExit) =>
						Effect.async<T, LibSQLDatabaseError | E, R>((resume) => {
							db.transaction(async (tx: TransactionClient) => {
								// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
