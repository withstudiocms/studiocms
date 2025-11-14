import { Context, Layer } from 'effect';
import type { Dialect } from 'kysely';
import {
	DBCallbackFailure,
	type DBClientInterface,
	type KyselyDBClientLive,
	makeDBClientLive,
} from './core/client.js';

export type { Dialect } from 'kysely';

export type { KyselyDBClientLive, DBClientInterface };

export { DBCallbackFailure };

/**
 * Factory that creates a live database client configured for the specified SQL dialect.
 *
 * This exported helper forwards the provided dialect to an underlying `makeDBClientLive`
 * implementation and returns the resulting database client instance typed to the supplied
 * schema generic.
 *
 * @typeParam Schema - The database schema type describing tables, columns and relations.
 *                      Defaults to `StudioCMSDatabaseSchema`.
 * @param dialect - The SQL dialect or driver configuration used to instantiate the client
 *                  (e.g., PostgreSQL, MySQL, SQLite, etc.).
 * @returns A fully configured, live database client instance typed to `Schema`.
 *
 * @example
 * // Create a client for the Chosen dialect:
 * // const db = getDBClientLive<MySchema>(yourDriver);
 */
export const getDBClientLive = <Schema>(dialect: Dialect) => makeDBClientLive<Schema>(dialect);

export class KyselyDBClientService extends Context.Tag(
	'@withstudiocms/kysely/client/KyselyDBClientService'
)<
	KyselyDBClientService,
	{
		getDBClientLive: <Schema>(dialect: Dialect) => KyselyDBClientLive<Schema>;
	}
>() {
	static Live = Layer.succeed(this, {
		getDBClientLive: <Schema>(dialect: Dialect) => getDBClientLive<Schema>(dialect),
	});
}
