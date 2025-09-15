import { db as client } from 'astro:db';
import { drizzleDBClientLive } from '@withstudiocms/effect/drizzle';
import { Effect } from '../../../effect.js';

export { LibSQLClientError } from '@withstudiocms/effect/drizzle';

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

		const { execute, makeQuery } = yield* drizzleDBClientLive({ drizzle: db });

		return {
			db,
			execute,
			makeQuery,
		};
	}),
}) {}
