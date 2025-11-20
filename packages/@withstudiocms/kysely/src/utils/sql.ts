import { Effect } from 'effect';
import { type QueryResult, type Sql, sql } from 'kysely';
import { SqlError } from './errors.js';

/**
 * Wraps a SQL execution function in an Effect, handling errors appropriately.
 *
 * @param fn - A function that takes a Sql instance and returns a Promise of QueryResult.
 * @returns An Effect that resolves to the QueryResult or fails with a SqlError.
 */
export const makeSql = <T>(fn: (sql: Sql) => Promise<QueryResult<T>>) =>
	Effect.tryPromise({
		try: () => fn(sql),
		catch: (cause) => new SqlError({ cause }),
	});
