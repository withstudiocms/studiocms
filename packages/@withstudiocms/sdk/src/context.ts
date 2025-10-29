import { Context, Layer } from '@withstudiocms/effect';
import type { DBClientInterface, StudioCMSDatabaseSchema } from '@withstudiocms/kysely';

/**
 * Context tag representing the database client interface for StudioCMS.
 *
 * This tag can be used to access the database client instance throughout the SDK,
 * allowing for database operations to be performed in a type-safe manner.
 */
export class DBClientLive extends Context.Tag('@withstudiocms/sdk/context/DBClientLive')<
	DBClientLive,
	DBClientInterface<StudioCMSDatabaseSchema>
>() {
	/**
	 * Provides a live layer for the DBClient context tag using the given database client.
	 *
	 * @param db - The database client instance to be provided.
	 * @returns A layer that provides the DBClient context tag.
	 */
	static Live = (db: DBClientInterface<StudioCMSDatabaseSchema>) => Layer.succeed(this, db);
}
