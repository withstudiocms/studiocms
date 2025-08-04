import { eq } from 'astro:db';
import { Effect, genLogger } from '../../effect.js';
import { AstroDB } from '../effect/db.js';
import { tsPluginData } from '../tables.js';

/**
 * Represents a single plugin data entry.
 *
 * @template T - The type of the data stored in the plugin entry.
 * @property id - The unique identifier for the plugin data entry.
 * @property data - The data associated with the plugin, of type T.
 */
export type PluginDataEntry<T> = {
	id: string;
	data: T;
};

/**
 * Wraps the provided `id` and `data` into a `PluginDataEntry<T>` object and returns it as an Effect.
 *
 * @template T - The type of the data to be wrapped.
 * @param id - The unique identifier for the plugin data entry.
 * @param data - The data to be associated with the given id.
 * @returns An Effect that, when executed, yields a `PluginDataEntry<T>` containing the provided id and data.
 */
const parsedDataResponse = <T>(id: string, data: T) =>
	Effect.try(
		() =>
			({
				id,
				data,
			}) as PluginDataEntry<T>
	);

/**
 * Provides effectful operations for managing plugin-specific data entries in the database.
 *
 * The `SDKCore_PLUGINS` service exposes utilities for plugins to store, retrieve, and update
 * their own data entries, scoped by a unique `pluginId` and `entryId`. All operations are
 * effectful and designed to be used within an Effect context.
 *
 * @remarks
 * - Depends on the `AstroDB` service for database access.
 * - All methods are effectful and yield results or errors as Effects.
 *
 * @example
 * ```typescript
 * const plugins = yield* SDKCore_PLUGINS;
 * const pluginDataOps = yield* plugins.usePluginData('myPlugin', 'entry1');
 * const data = yield* pluginDataOps.select<MyDataType>();
 * ```
 *
 * @service
 * @module studiocms/sdk/SDKCore/modules/plugins
 */
export class SDKCore_PLUGINS extends Effect.Service<SDKCore_PLUGINS>()(
	'studiocms/sdk/SDKCore/modules/plugins',
	{
		dependencies: [AstroDB.Default],
		effect: genLogger('studiocms/sdk/SDKCore/modules/plugins/effect')(function* () {
			const dbService = yield* AstroDB;

			/**
			 * Provides a set of effectful operations for managing plugin-specific data entries in the database,
			 * scoped by a given `pluginId` and `entryId`. The returned object exposes three main methods:
			 *
			 * - `select<T>()`: Retrieves and parses the plugin data of type `T` for the specified plugin and entry.
			 *   Returns `undefined` if no data exists.
			 * - `insert<T>(data: T)`: Inserts new plugin data of type `T` for the specified plugin and entry.
			 *   Fails if data with the same ID already exists.
			 * - `update<T>(data: T)`: Updates the plugin data of type `T` for the specified plugin and entry.
			 *
			 * All methods are effectful and should be used within an Effect context.
			 *
			 * @param pluginId - The unique identifier for the plugin.
			 * @param entryId - The unique identifier for the data entry within the plugin.
			 * @returns An object containing `select`, `insert`, and `update` effectful methods for plugin data management.
			 */
			const usePluginData = (pluginId: string, entryId: string) =>
				genLogger('usePluginData')(function* () {
					const id = `${pluginId}_${entryId}`;

                    /**
                     * Retrieves and parses plugin data from the database for a given plugin ID.
                     *
                     * This generator function executes a database query to fetch the raw plugin data,
                     * attempts to parse it as JSON, and returns the parsed data wrapped in a response.
                     * If the data is not found, it returns `undefined`. If parsing fails, it throws an error
                     * with a descriptive message.
                     *
                     * @template T - The expected type of the parsed plugin data.
                     * @returns {Effect.Effect<unknown, Error, T | undefined>} An Effect that yields the parsed plugin data of type `T`, or `undefined` if not found.
                     */
					const select = Effect.fn(function* <T>() {
						const dbData = yield* dbService.execute((db) =>
							db.select().from(tsPluginData).where(eq(tsPluginData.id, id)).get()
						);

						if (!dbData) {
							return undefined;
						}

						const data = yield* Effect.try({
							try: () => JSON.parse(dbData.rawData as string) as T,
							catch: (error) => {
								throw new Error(
									`Failed to parse plugin data for ${id}: ${(error as Error).message}`
								);
							},
						});

						return yield* parsedDataResponse<T>(id, data);
					});

                    /**
                     * Inserts new plugin data into the database if an entry with the given ID does not already exist.
                     *
                     * @template T - The type of the data to insert.
                     * @param data - The plugin data to be inserted.
                     * @yields Fails with an error if plugin data with the specified ID already exists.
                     * @returns The parsed data response for the newly inserted entry.
                     */
					const insert = Effect.fn(function* <T>(data: T) {
						const checkExistingId = yield* dbService.execute((db) =>
							db.select().from(tsPluginData).where(eq(tsPluginData.id, id)).get()
						);

						if (checkExistingId) {
							return yield* Effect.fail(new Error(`Plugin data with ID ${id} already exists.`));
						}

						const rawData = JSON.stringify(data);

						const insertedEntry = yield* dbService.execute((db) =>
							db
								.insert(tsPluginData)
								.values({
                                    // @ts-expect-error - drizzle broke this
									id,
									rawData,
								})
								.returning({ id: tsPluginData.id })
								.get()
						);

						return yield* parsedDataResponse<T>(insertedEntry.id, data);
					});

                    /**
                     * Updates a plugin data record in the database with the provided data.
                     *
                     * @template T - The type of the data to update.
                     * @param data - The data object to be serialized and stored.
                     * @returns A generator yielding the parsed data response for the updated record.
                     *
                     * @remarks
                     * - Serializes the input data to JSON and updates the corresponding database record.
                     * - Returns the parsed data response for the updated record.
                     */
					const update = Effect.fn(function* <T>(data: T) {
						const rawData = JSON.stringify(data);

						const updatedData = yield* dbService.execute((db) =>
							db
								.update(tsPluginData)
								.set({ rawData })
								.where(eq(tsPluginData.id, id))
								.returning({ id: tsPluginData.id })
								.get()
						);

						return yield* parsedDataResponse<T>(updatedData.id, data);
					});

					return {
						select,
						insert,
						update,
					};
				});

            /**
             * An object containing utility functions related to plugins.
             *
             * @property usePluginData - A function to access or manipulate plugin data.
             */
			const PLUGINS = {
				usePluginData,
			};

			return PLUGINS;
		}),
	}
) {}
