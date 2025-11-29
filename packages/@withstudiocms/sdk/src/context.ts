import { Context, Layer } from '@withstudiocms/effect';
import type { DBClientInterface, StudioCMSDatabaseSchema } from '@withstudiocms/kysely';
import type { CacheEntry } from './cache.js';

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

/**
 * Interface representing the default SDK options.
 */
export interface SDKDefaultOpts {
	GhostUserDefaults: {
		id: string;
		name: string;
		username: string;
		avatar: string;
	};
	NotificationSettingsDefaults: {
		emailVerification: boolean;
		oAuthBypassVerification: boolean;
		requireEditorVerification: boolean;
		requireAdminVerification: boolean;
	};
}

/**
 * Context tag representing the default SDK options.
 *
 * This tag can be used to access default configuration options for the SDK,
 * such as default user settings.
 */
export class SDKDefaults extends Context.Tag('@withstudiocms/sdk/context/SDKDefaults')<
	SDKDefaults,
	SDKDefaultOpts
>() {
	/**
	 * Provides a live layer for the SDKDefaults context tag using the given options.
	 *
	 * @param opts - The options to be provided.
	 * @returns A layer that provides the SDKDefaults context tag.
	 */
	static live = (opts: SDKDefaultOpts) => Layer.succeed(this, opts);
}

/**
 * Interface representing the SDK context, combining the database client and default options.
 */
export interface SDKContext {
	db: DBClientInterface<StudioCMSDatabaseSchema>;
	defaults: SDKDefaultOpts;
	cache: {
		store: Map<string, CacheEntry<unknown>>;
		tagIndex: Map<string, Set<string>>;
	};
}

export class CacheStores extends Context.Tag('@withstudiocms/sdk/context/CacheStores')<
	CacheStores,
	SDKContext['cache']
>() {
	static live = (cache: SDKContext['cache']) => Layer.succeed(this, cache);
}

/**
 * Combines the database client and SDK default options into a single SDK context layer.
 *
 * @param context - An object containing the database client and default SDK options.
 * @returns A merged layer that provides both the DBClient and SDKDefaults context tags.
 */
export const makeSDKContext = (context: SDKContext) =>
	Layer.mergeAll(
		DBClientLive.Live(context.db),
		SDKDefaults.live(context.defaults),
		CacheStores.live(context.cache)
	);
