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
export type PluginDataEntry<T extends object> = {
	id: string;
	data: T;
};

/**
 * A function type that parses raw data and validates it using a type guard.
 *
 * @typeParam T - The expected object type after validation.
 * @param rawData - The raw input data to be parsed and validated.
 * @param validator - A type guard function that checks if the data conforms to type T.
 * @returns An Effect that yields the validated data of type T, or an Error if validation fails.
 */
export type ParseDataFn = <T extends object>(
	rawData: unknown,
	validator: (data: unknown) => data is T
) => Effect.Effect<T, Error, never>;

/**
 * Wraps the provided `id` and `data` into a `PluginDataEntry<T>` object and returns it as an Effect.
 *
 * @template T - The type of the data to be wrapped.
 * @param id - The unique identifier for the plugin data entry.
 * @param data - The data to be associated with the given id.
 * @returns An Effect that, when executed, yields a `PluginDataEntry<T>` containing the provided id and data.
 */
export const parsedDataResponse = <T extends object>(id: string, data: T) =>
	Effect.try(
		() =>
			({
				id,
				data,
			}) as PluginDataEntry<T>
	);

/**
 * Parses and validates input data using a provided validator function.
 *
 * This generator function attempts to parse the input `rawData` as JSON if it is a string,
 * or uses it directly if it is a non-null object. It then validates the parsed data using
 * the provided `validator` function. If parsing or validation fails, it yields an error.
 *
 * @typeParam T - The expected type of the validated data.
 * @param rawData - The input data to be parsed and validated. Can be a JSON string or an object.
 * @param validator - A type guard function that checks if the parsed data conforms to type `T`.
 * @yields {T} The parsed and validated data of type `T`.
 * @throws {Error} If JSON parsing fails, if the input format is invalid, or if validation fails.
 * @returns {T} The parsed and validated data.
 */
export const parseData: ParseDataFn = Effect.fn(function* (rawData, validator) {
	let parsedInput: unknown;

	// Check if rawData is a string or an object
	// Data from the db should already be a object, but we handle strings for flexibility
	if (typeof rawData === 'string') {
		parsedInput = yield* Effect.try({
			try: () => JSON.parse(rawData),
			catch: (error) => new Error(`JSON parsing failed: ${error}`),
		});
		// Ensure parsedInput is an object
		// If rawData is not a string, we assume it's already an object
	} else if (rawData !== null && typeof rawData === 'object') {
		parsedInput = rawData;
	} else {
		// If rawData is neither a string nor a valid object, throw an error
		return yield* Effect.fail(new Error(`Invalid plugin data format: ${typeof rawData}`));
	}

	// Validate the parsed input using the user/plugin provided validator function
	// If the validator returns false, we throw an error
	if (!validator(parsedInput)) {
		return yield* Effect.fail(new Error('Data validation failed'));
	}

	// If validation passes, return the parsed input
	// This will be of type T, as ensured by the validator
	return parsedInput;
});

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
			 * Creates a function to check for the existence of a plugin by its ID in the database.
			 *
			 * @param toCheck - The ID of the plugin to check for.
			 * @returns The plugin data if found, otherwise undefined.
			 *
			 * @example
			 * const plugin = await checkForId('plugin-id');
			 * if (plugin) {
			 *   // Plugin exists
			 * }
			 */
			const checkForId = dbService.makeQuery((query, toCheck: string) =>
				query((db) => db.select().from(tsPluginData).where(eq(tsPluginData.id, toCheck)).get())
			);

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
					 * Selects and parses data associated with a given `id` using a provided type guard validator.
					 *
					 * This generator function checks for the existence of data by `id`, validates and parses it,
					 * and returns a parsed data response if successful. If no data exists for the given `id`, it returns `undefined`.
					 *
					 * @typeParam T - The expected shape of the parsed data.
					 * @param validator - A type guard function that asserts whether the provided data is of type `T`.
					 * @returns A generator yielding either a parsed data response of type `T` or `undefined` if no data exists.
					 *
					 * ## Example of a user data type and a validator function.
					 *
					 * @example
					 * ```typescript
					 * interface User {
					 *   id: number;
					 *   name: string;
					 *   email: string;
					 * }
					 *
					 * const isUser = (data: unknown): data is User => {
					 *   return (
					 *     typeof data === 'object' &&
					 *     data !== null &&
					 *     'id' in data &&
					 *     'name' in data &&
					 *     'email' in data &&
					 *     typeof (data as any).id === 'number' &&
					 *     typeof (data as any).name === 'string' &&
					 *     typeof (data as any).email === 'string'
					 *   );
					 * };
					 *
					 * // Usage
					 * const getPluginData = yield* usePluginData('myPlugin', 'user1');
					 *
					 * const userData = yield* getPluginData.select<User>(isUser);
					 * ```
					 * userData will be of type `{ id: string, data: User }` or `undefined` if no data exists.
					 */
					const select = Effect.fn(function* <T extends object>(
						validator: (data: unknown) => data is T
					) {
						const existing = yield* checkForId(id);

						if (!existing) return undefined;

						const data = yield* parseData<T>(existing.data, validator);

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
					const insert = Effect.fn(function* <T extends object>(data: T) {
						const checkExistingId = yield* checkForId(id);

						if (checkExistingId) {
							return yield* Effect.fail(new Error(`Plugin data with ID ${id} already exists.`));
						}

						const insertedEntry = yield* dbService.execute((db) =>
							db
								.insert(tsPluginData)
								.values({
									// @ts-expect-error - drizzle broke the 'id' type
									id,
									data,
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
					const update = Effect.fn(function* <T extends object>(data: T) {
						const checkExistingId = yield* checkForId(id);

						if (!checkExistingId) {
							return yield* Effect.fail(new Error(`Plugin data with ID ${id} does not exist.`));
						}

						const updatedData = yield* dbService.execute((db) =>
							db
								.update(tsPluginData)
								.set({ data })
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
