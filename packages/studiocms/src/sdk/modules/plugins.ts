import { eq, like } from 'astro:db';
import { Effect, genLogger, pipe, type Schema } from '../../effect.js';
import { AstroDB, type LibSQLDatabaseError } from '../effect/db.js';
import {
	noUndefinedEntries,
	parseData,
	parsedDataResponse,
	type RecursiveSimplifyMutable,
	SelectPluginDataRespondOrFail,
} from '../effect/pluginUtils.js';
import { tsPluginData } from '../tables.js';
import type {
	PluginDataCacheObject,
	PluginDataEntry,
	tsPluginDataInsert,
	tsPluginDataSelect,
	UsePluginDataOpts,
	UsePluginDataOptsBase,
	UserPluginDataOptsImplementation,
	ValidatorOptions,
} from '../types/index.js';
import { CacheContext, isCacheEnabled, isCacheExpired } from '../utils.js';

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
			const [dbService, { pluginData }] = yield* Effect.all([AstroDB, CacheContext]);

			/**
			 * Provides a set of database operations for managing plugin data entries.
			 */
			const _db = {
				/**
				 * Creates a batch request function for querying plugin data from the database.
				 *
				 * The returned function accepts an object with `batchSize` and `offset` properties,
				 * and performs a database query to select a batch of plugin data records with the specified
				 * limit and offset.
				 */
				batchRequest: dbService.makeQuery((query, o: { batchSize: number; offset: number }) =>
					query((db) => db.select().from(tsPluginData).limit(o.batchSize).offset(o.offset))
				),
				/**
				 * Retrieves plugin data entries from the database whose IDs match the specified plugin ID prefix.
				 */
				getEntriesPluginData: dbService.makeQuery((query, pluginId: string) =>
					query((db) =>
						db
							.select()
							.from(tsPluginData)
							.where(like(tsPluginData.id, `${pluginId}-%`))
					)
				),
				/**
				 * Executes a database query to select a single plugin data entry by its ID.
				 */
				selectPluginDataEntry: dbService.makeQuery((query, id: string) =>
					query((db) => db.select().from(tsPluginData).where(eq(tsPluginData.id, id)).get())
				),
				/**
				 * Inserts a new plugin data entry into the database and returns the inserted record.
				 */
				insertPluginDataEntry: dbService.makeQuery((query, data: tsPluginDataInsert) =>
					query((db) => db.insert(tsPluginData).values(data).returning().get())
				),
				/**
				 * Updates an existing plugin data entry in the database.
				 */
				updatePluginDataEntry: dbService.makeQuery((query, data: tsPluginDataSelect) =>
					query((db) =>
						db.update(tsPluginData).set(data).where(eq(tsPluginData.id, data.id)).returning().get()
					)
				),
			};

			/**
			 * Initializes the plugin data cache by loading entries from the database in batches.
			 *
			 * This generator function retrieves plugin data from the database using a fixed batch size,
			 * and populates the `pluginData` cache with each entry. All cached entries share a single
			 * timestamp indicating when the cache was last updated. The function continues fetching and
			 * caching entries until no more entries are returned from the database.
			 *
			 * @remarks
			 * - Uses a default batch size of 100 entries per database query to efficiently handle large datasets.
			 * - Each cache entry is stored as a tuple containing the entry data and the shared timestamp.
			 * - Intended to be used as an effect within an effectful programming model.
			 *
			 * @yields {void} Yields control to the effect system for each database operation.
			 */
			const initPluginDataCache = Effect.fn(
				'studiocms/sdk/SDKCore/modules/plugins/effect/initPluginDataCache'
			)(function* (BATCH_SIZE?: number) {
				let batchSize = BATCH_SIZE || 100; // Default batch size if not provided
				if (batchSize <= 0) {
					batchSize = 100; // Ensure a positive batch size
				}
				let offset = 0;
				const sharedTimestamp = new Date(); // Single timestamp for all entries

				while (true) {
					const entries = yield* _db.batchRequest({ batchSize, offset });

					if (entries.length === 0) break;

					// Batch insert into cache
					const cacheEntries = entries.map(
						(entry) => [entry.id, { data: entry, lastCacheUpdate: sharedTimestamp }] as const
					);

					// Use Map constructor or batch set operations
					for (const [id, cacheData] of cacheEntries) {
						pluginData.set(id, cacheData);
					}

					offset += batchSize;
				}
			});

			/**
			 * Attempts to clear the plugin data cache using the `pluginData.clear()` method.
			 * If an error occurs during the cache clearing process, it logs the error to the console
			 * and returns a new `Error` instance with a descriptive message.
			 *
			 * @returns {Effect<unknown, Error, void>} An Effect that represents the attempt to clear the plugin data cache,
			 * resolving to `void` on success or an `Error` on failure.
			 */
			const clearPluginDataCache = (): Effect.Effect<void, Error, never> =>
				Effect.try({
					try: () => pluginData.clear(),
					catch: () => new Error('Failed to clear plugin data cache'),
				});

			/**
			 * Retrieves a plugin data entry by its ID, utilizing a cache if enabled.
			 *
			 * - If caching is enabled and the entry exists in the cache and is not expired, returns the cached data.
			 * - If the entry is not in the cache or the cache is expired, fetches fresh data from the database,
			 *   updates the cache, and returns the fresh data.
			 * - If caching is not enabled, always fetches the latest data from the database.
			 *
			 * @param id - The unique identifier of the plugin data entry to retrieve.
			 * @returns An object containing the plugin data entry, or `undefined` if not found.
			 */
			const _selectPluginDataEntry = Effect.fn(
				'studiocms/sdk/SDKCore/modules/plugins/effect/_selectPluginDataEntry'
			)(function* (id: string) {
				if (yield* isCacheEnabled) {
					// Check the cache for the plugin data entry
					const cached = pluginData.get(id);
					if (cached && !isCacheExpired(cached)) {
						const { data: cacheData } = cached;
						// If the entry is found in the cache and is not expired, return it
						return cacheData;
					}

					// If the entry is not found in the cache or is expired, query the database
					// and update the cache with the new data
					const fresh = yield* _db.selectPluginDataEntry(id);
					if (fresh) {
						pluginData.set(id, {
							data: fresh,
							lastCacheUpdate: new Date(),
						});
					}
					return fresh;
				}

				// If caching is not enabled, directly query the database
				// This ensures that we always get the latest data from the database
				return yield* _db.selectPluginDataEntry(id);
			});

			/**
			 * Inserts a new plugin data entry into the database and updates the cache if enabled.
			 *
			 * @param data - The plugin data to insert.
			 * @returns The newly inserted plugin data entry.
			 *
			 * @remarks
			 * If caching is enabled, this function will update the in-memory cache with the new data,
			 * ensuring cache consistency with the database.
			 */
			const _insertPluginDataEntry = Effect.fn(
				'studiocms/sdk/SDKCore/modules/plugins/effect/_insertPluginDataEntry'
			)(function* (data: tsPluginDataInsert) {
				// Insert the plugin data entry into the database
				const newData = yield* _db.insertPluginDataEntry(data);

				// If caching is enabled, update the cache with the new data
				// This ensures that the cache is always in sync with the database
				if (yield* isCacheEnabled) {
					pluginData.set(newData.id, {
						data: newData,
						lastCacheUpdate: new Date(),
					});
				}

				// Return the newly inserted data
				return newData;
			});

			/**
			 * Updates a plugin data entry in the database and, if caching is enabled, updates the cache with the new data.
			 *
			 * @param data - The plugin data entry to update.
			 * @returns The updated plugin data entry.
			 *
			 * @remarks
			 * This function performs the update operation using `_dbUpdatePluginDataEntry`. If caching is enabled,
			 * it also updates the in-memory cache with the new data and the current timestamp.
			 */
			const _updatePluginDataEntry = Effect.fn(
				'studiocms/sdk/SDKCore/modules/plugins/effect/_updatePluginDataEntry'
			)(function* (data: tsPluginDataSelect) {
				// Update the plugin data entry in the database
				const updatedData = yield* _db.updatePluginDataEntry(data);

				// If caching is enabled, update the cache with the new data
				if (yield* isCacheEnabled) {
					pluginData.set(updatedData.id, {
						data: updatedData,
						lastCacheUpdate: new Date(),
					});
				}

				// Return the updated data
				return updatedData;
			});

			/**
			 * Processes a plugin data cache entry, validating and updating it as necessary.
			 *
			 * This generator function checks if the cache entry is associated with the specified plugin,
			 * determines if the cache is expired, and if so, fetches the latest data from the database.
			 * It validates the data using the provided validator, updates the cache if needed, and returns
			 * a parsed data response. If the cache is not expired, it returns the validated cached data.
			 *
			 * @template T - The type of the data object to validate and return.
			 * @param {[string, PluginDataCacheObject]} param0 - A tuple containing the cache key and the cache object.
			 * @param {string} pluginId - The ID of the plugin to filter cache entries.
			 * @param {ValidatorOptions<T>} [validator] - Optional validator options for data validation.
			 * @returns {Effect<unknown, unknown, (ParsedDataResponse<T> | undefined)>} The parsed data response for the entry, or undefined if not applicable.
			 */
			const _processEntryFromCache = Effect.fn(function* <
				T extends Schema.Struct<Schema.Struct.Fields> | object,
			>(
				[key, { data: entry, lastCacheUpdate }]: [string, PluginDataCacheObject],
				pluginId: string,
				validator?: ValidatorOptions<T>
			) {
				// If the key does not start with the pluginId, skip it
				// This ensures that we only process entries related to the specified plugin
				if (!key.startsWith(pluginId)) {
					return undefined;
				}

				if ((yield* isCacheEnabled) && isCacheExpired({ lastCacheUpdate })) {
					// If the cache is expired, we need to fetch the latest data from the database
					const freshEntry = yield* _db.selectPluginDataEntry(entry.id);

					// If the entry is not found in the database, we can skip it
					if (!freshEntry) {
						yield* Effect.log(`Removing stale cache entry: ${entry.id}`);
						pluginData.delete(entry.id);
						return undefined;
					}

					// Validate the fresh entry data
					// This ensures that we always return valid data
					const validated = yield* parseData<T>(freshEntry.data, validator);

					// If the entry is found in the database, update the cache
					pluginData.set(entry.id, {
						data: freshEntry,
						lastCacheUpdate: new Date(),
					});

					// Return the parsed data response for the entry
					// This ensures that we always return the most up-to-date data
					return yield* parsedDataResponse<T>(entry.id, validated);
				}

				// If the entry is not expired or not found in the database, return the cached data
				const validated = yield* parseData<T>(entry.data, validator);
				return yield* parsedDataResponse<T>(entry.id, validated);
			});

			/**
			 * Processes a plugin data entry retrieved from the database.
			 *
			 * @template T - The expected shape of the validated data object.
			 * @param entry - The plugin data entry to process.
			 * @param validator - Optional validator options to validate the entry's data.
			 * @yields The validated data after parsing.
			 * @yields Updates the cache with the entry if caching is enabled.
			 * @returns The parsed data response for the entry.
			 */
			const _processEntryFromDB = Effect.fn(function* <
				T extends Schema.Struct<Schema.Struct.Fields> | object,
			>(entry: tsPluginDataSelect, validator?: ValidatorOptions<T>) {
				// Validate the data for each entry
				const validated = yield* parseData<T>(entry.data, validator);

				// If caching is not enabled, we do not update the cache
				if (yield* isCacheEnabled) {
					// If caching is enabled, update the cache with the new data
					pluginData.set(entry.id, {
						data: entry,
						lastCacheUpdate: new Date(),
					});
				}

				// Return the parsed data response for the entry
				return yield* parsedDataResponse<T>(entry.id, validated);
			});

			/**
			 * Retrieves plugin data entries for a given plugin ID, with optional validation.
			 *
			 * This function first attempts to retrieve entries from the in-memory cache if caching is enabled.
			 * - If cached entries are found and not expired, they are validated and returned.
			 * - If cached entries are expired, the latest data is fetched from the database, validated, and the cache is updated.
			 * - If no entries are found in the cache, all entries are fetched from the database, validated, and cached.
			 *
			 * If caching is not enabled, all entries are fetched directly from the database and validated.
			 *
			 * @typeParam T - The expected shape of the plugin data after validation.
			 * @param pluginId - The unique identifier for the plugin whose entries are to be retrieved.
			 * @param validator - (Optional) Validation options to apply to each entry's data.
			 * @returns An Effect yielding an array of validated and parsed plugin data responses.
			 */
			const _getEntries = Effect.fn('studiocms/sdk/SDKCore/modules/plugins/effect/_getEntries')(
				function* <T extends Schema.Struct<Schema.Struct.Fields> | object>(
					pluginId: string,
					validator?: ValidatorOptions<T>
				) {
					if (yield* isCacheEnabled) {
						const data = yield* pipe(
							pluginData.entries(),
							Effect.forEach((entry) => _processEntryFromCache<T>(entry, pluginId, validator)),
							Effect.map(noUndefinedEntries)
						);

						// If we have valid data from the cache, return it
						if (data.length > 0) return data;
					}

					// If caching is not enabled or no valid data was found in the cache,
					// we need to fetch the latest data from the database
					// This ensures that we always have the most up-to-date entries for the plugin
					return yield* pipe(
						_db.getEntriesPluginData(pluginId),
						Effect.flatMap(Effect.forEach((entry) => _processEntryFromDB<T>(entry, validator)))
					);
				}
			);

			/**
			 * Checks if plugin data with the specified ID exists and responds or fails based on the `shouldFail` flag.
			 *
			 * @param id - The unique identifier of the plugin data to check.
			 * @param shouldFail - Determines the behavior when plugin data with the given ID exists:
			 *   - If `true` and the data exists, the effect fails with an error.
			 *   - If `false` and the data does not exist, returns `false`.
			 *   - Otherwise, returns `true`.
			 * @returns
			 *   - Fails with an error if the data exists and `shouldFail` is `true`.
			 *   - Returns `false` if the data does not exist and `shouldFail` is `false`.
			 *   - Returns `true` otherwise.
			 */
			const _selectPluginDataEntryRespondOrFail = Effect.fn(
				'studiocms/sdk/SDKCore/modules/plugins/effect/_selectPluginDataEntryRespondOrFail'
			)(function* (id: string, mode: SelectPluginDataRespondOrFail) {
				// Check if the plugin data with the given ID exists
				const existing = yield* _selectPluginDataEntry(id);

				// If the plugin data exists, we handle it based on the mode and shouldFail flag
				// If it does not exist, we handle it based on the mode and shouldFail
				switch (mode) {
					case SelectPluginDataRespondOrFail.ExistsNoFail: {
						// If it exists, return the existing data
						if (existing) return existing;
						// If it does not exist, return undefined
						return undefined;
					}
					case SelectPluginDataRespondOrFail.ExistsShouldFail: {
						// If it exists, fail with an error
						if (existing)
							return yield* Effect.fail(new Error(`Plugin data with ID ${id} already exists.`));
						// If it does not exist, return undefined
						return undefined;
					}
					case SelectPluginDataRespondOrFail.NotExistsShouldFail: {
						// If it does not exist, fail with an error
						if (!existing)
							return yield* Effect.fail(new Error(`Plugin data with ID ${id} does not exist.`));
						// If it exists, return undefined
						return undefined;
					}
					default:
						return yield* Effect.fail(new Error(`Invalid mode: ${mode}`));
				}
			});

			/**
			 * Selects and parses plugin data for a given entry ID.
			 *
			 * This generator function attempts to retrieve plugin data associated with the specified `generatedEntryId`.
			 * - If the data exists, it validates and parses the data using the provided `validator` (if any), and returns the parsed data response.
			 * - If the data does not exist, it returns `undefined` without throwing an error, making it suitable for optional plugin data scenarios.
			 *
			 * @typeParam T - The expected schema or object type for the plugin data.
			 * @param generatedEntryId - The unique identifier for the plugin data entry to select.
			 * @param validator - (Optional) Validation options or schema for parsing the plugin data.
			 * @returns The parsed plugin data response of type `T`, or `undefined` if the entry does not exist.
			 */
			const _select = Effect.fn(
				'studiocms/sdk/SDKCore/modules/plugins/effect/usePluginData.select'
			)(function* <T extends Schema.Struct<Schema.Struct.Fields> | object>(
				generatedEntryId: string,
				validator?: ValidatorOptions<T>
			) {
				// Check if the plugin data with the given ID exists
				// If it exists, proceed to validate and parse the data
				// If it does not exist, return undefined
				// This ensures that we only attempt to parse existing data
				// and do not throw an error when the data is not found
				// This is useful for cases where the plugin data is optional
				const existing = yield* _selectPluginDataEntryRespondOrFail(
					generatedEntryId,
					SelectPluginDataRespondOrFail.ExistsNoFail
				);

				// If it does not exist, return undefined
				if (!existing) return undefined;

				// Validate and parse the existing data
				const data = yield* parseData<T>(existing.data, validator);

				// Return the parsed data response for the existing entry
				return yield* parsedDataResponse<T>(generatedEntryId, data);
			});

			/**
			 * Inserts a new plugin data entry into the database.
			 *
			 * This function first checks if an entry with the given `generatedEntryId` already exists.
			 * If it does, the operation fails to ensure uniqueness and prevent duplicate entries.
			 * If not, it validates the provided data using the optional `validator`, then inserts the new entry.
			 * The inserted data is returned in a parsed response format.
			 *
			 * @template T - The type of the data to insert, which can be a Schema.Struct or a plain object.
			 * @param generatedEntryId - The unique identifier for the plugin data entry.
			 * @param data - The data to be inserted.
			 * @param validator - Optional validation options for the data.
			 * @returns The inserted and parsed plugin data entry.
			 * @throws If an entry with the given ID already exists or if validation fails.
			 */
			const _insert = Effect.fn(
				'studiocms/sdk/SDKCore/modules/plugins/effect/usePluginData.insert'
			)(function* <T extends Schema.Struct<Schema.Struct.Fields> | object>(
				generatedEntryId: string,
				data: T,
				validator?: ValidatorOptions<T>
			) {
				// Check if the plugin data with the given ID already exists
				// If it exists, fail with an error
				// This ensures that we do not accidentally insert duplicate entries
				// and maintain the uniqueness of the plugin data entries
				// If it does not exist, proceed to insert the new data
				yield* _selectPluginDataEntryRespondOrFail(
					generatedEntryId,
					SelectPluginDataRespondOrFail.ExistsShouldFail
				);

				// Validate the data before inserting
				const parsedData = yield* parseData<T>(data, validator);

				// Insert the new plugin data into the database
				// Note: The 'id' field is expected to be unique, so we use
				// it as the primary key in the table definition.
				const inserted = yield* _insertPluginDataEntry({
					id: generatedEntryId,
					data: parsedData,
				});

				// Return the inserted data
				return yield* parsedDataResponse<T>(inserted.id, parsedData);
			});

			/**
			 * Updates an existing plugin data entry by its generated ID.
			 *
			 * This function performs the following steps:
			 * 1. Checks if the plugin data entry with the specified ID exists.
			 *    - If it does not exist, the operation fails to prevent accidental creation.
			 * 2. Optionally validates the provided data using the given validator options.
			 * 3. Updates the existing plugin data entry in the database with the validated data.
			 * 4. Returns a parsed data response for the updated record.
			 *
			 * @template T - The shape of the data to update, either a Schema.Struct or a plain object.
			 * @param generatedEntryId - The unique identifier of the plugin data entry to update.
			 * @param data - The new data to update the entry with.
			 * @param validator - (Optional) Validator options to validate the data before updating.
			 * @returns The parsed data response for the updated plugin data entry.
			 * @throws If the plugin data entry does not exist or if validation fails.
			 */
			const _update = Effect.fn(
				'studiocms/sdk/SDKCore/modules/plugins/effect/usePluginData.update'
			)(function* <T extends Schema.Struct<Schema.Struct.Fields> | object>(
				generatedEntryId: string,
				data: T,
				validator?: ValidatorOptions<T>
			) {
				// Check if the plugin data with the given ID exists
				// If it does not exist, fail with an error
				// This ensures that we only update existing records
				// and prevents accidental creation of new records
				// when trying to update non-existing data
				yield* _selectPluginDataEntryRespondOrFail(
					generatedEntryId,
					SelectPluginDataRespondOrFail.NotExistsShouldFail
				);

				// Validate the data before updating
				const parsedData = yield* parseData<T>(data, validator);

				// Update the existing plugin data in the database
				const updated = yield* _updatePluginDataEntry({
					id: generatedEntryId,
					data: parsedData,
				});

				// Return the parsed data response for the updated record
				return yield* parsedDataResponse<T>(updated.id, data);
			});

			const buildReturn = <T extends Schema.Struct<Schema.Struct.Fields> | object>(
				generatedEntryId: string,
				validator?: ValidatorOptions<T>
			) => ({
				/**
				 * Generates a unique ID for the plugin data entry.
				 *
				 * @returns An Effect that yields the generated ID. In the format `${pluginId}-${entryId}`
				 */
				generatedId: () => Effect.succeed(generatedEntryId),

				/**
				 * Selects a plugin data entry by its ID, validating the data if a validator is provided.
				 *
				 * @returns An Effect that yields the selected plugin data entry or `undefined` if not found.
				 */
				select: () => _select<T>(generatedEntryId, validator),

				/**
				 * Inserts new plugin data into the database after validating the input.
				 *
				 * @param data - The plugin data to insert.
				 * @yields Throws an error if validation fails or if the entry already exists.
				 * @returns The parsed data response for the inserted entry.
				 */
				insert: (data: T) => _insert<T>(generatedEntryId, data, validator),

				/**
				 * Updates existing plugin data in the database after validating the input.
				 *
				 * @param data - The updated plugin data.
				 * @yields Throws an error if validation fails.
				 * @returns The parsed data response for the updated entry.
				 */
				update: (data: T) => _update<T>(generatedEntryId, data, validator),
			});

			// Function overloads for `usePluginData` to handle different cases:
			// This function provides a set of effectful operations for managing plugin data entries.
			// It can be called with just a pluginId to retrieve all entries,
			// or with both pluginId and entryId to perform CRUD operations on a specific entry.
			// This allows for flexible usage depending on whether the user wants to
			// manage all entries for a plugin or a specific entry.

			/**
			 * Retrieves all plugin data entries for a given plugin ID.
			 */
			function usePluginData<
				T extends Schema.Struct<Schema.Struct.Fields> | object,
				// biome-ignore lint/suspicious/noExplicitAny: This is a generic type for the plugin data.
				R extends object = T extends Schema.Struct<any> ? RecursiveSimplifyMutable<T['Type']> : T,
			>(
				pluginId: string,
				opts?: UsePluginDataOptsBase<T>
			): {
				getEntries: () => Effect.Effect<PluginDataEntry<R>[], LibSQLDatabaseError | Error, never>;
				getEntry: (id: string) => {
					generatedId: () => Effect.Effect<string, never, never>;
					select: () => Effect.Effect<
						PluginDataEntry<R> | undefined,
						LibSQLDatabaseError | Error,
						never
					>;
					insert: (
						data: R
					) => Effect.Effect<PluginDataEntry<R>, LibSQLDatabaseError | Error, never>;
					update: (
						data: R
					) => Effect.Effect<PluginDataEntry<R>, LibSQLDatabaseError | Error, never>;
				};
			};

			/**
			 * Retrieves or manipulates plugin data entries for a specific plugin ID and entry ID.
			 *
			 * @param pluginId - The unique identifier for the plugin.
			 * @param entryId - (Optional) The unique identifier for the plugin data entry.
			 * @returns An object with methods to manage plugin data entries.
			 */
			function usePluginData<
				T extends Schema.Struct<Schema.Struct.Fields> | object,
				// biome-ignore lint/suspicious/noExplicitAny: This is a generic type for the plugin data.
				R extends object = T extends Schema.Struct<any> ? RecursiveSimplifyMutable<T['Type']> : T,
			>(
				pluginId: string,
				opts?: UsePluginDataOpts<T>
			): {
				generatedId: () => Effect.Effect<string, never, never>;
				select: () => Effect.Effect<
					PluginDataEntry<R> | undefined,
					LibSQLDatabaseError | Error,
					never
				>;
				insert: (data: R) => Effect.Effect<PluginDataEntry<R>, LibSQLDatabaseError | Error, never>;
				update: (data: R) => Effect.Effect<PluginDataEntry<R>, LibSQLDatabaseError | Error, never>;
			};

			/**
			 * Implementation of the `usePluginData` function that provides access to plugin data entries.
			 */
			function usePluginData<T extends Schema.Struct<Schema.Struct.Fields> | object>(
				pluginId: string,
				{ entryId, validator }: UserPluginDataOptsImplementation<T> = {}
			) {
				if (!entryId) {
					return {
						/**
						 * Retrieves all plugin data entries for the specified plugin ID.
						 *
						 * @template T - The type of the plugin data object.
						 * @param validator - Optional validator options for validating the plugin data.
						 * @returns An Effect that yields an array of `PluginDataEntry<T>` objects.
						 */
						getEntries: () => _getEntries<T>(pluginId, validator),
						getEntry: (id: string) => {
							const generatedEntryId = `${pluginId}-${id}`;
							return buildReturn<T>(generatedEntryId, validator);
						},
					};
				}
				const generatedEntryId = `${pluginId}-${entryId}`;
				return buildReturn<T>(generatedEntryId, validator);
			}

			/**
			 * Utility class to infer types from a given Schema.
			 *
			 * @typeParam S - The schema type extending `Schema.Struct<any>`.
			 *
			 * @property _Schema - The schema instance used for type inference.
			 * @property usePluginData - The inferred type from the schema, used for plugin data.
			 * @property Insert - A recursively simplified, mutable version of the schema's type.
			 *
			 */
			// biome-ignore lint/suspicious/noExplicitAny: as this is a generic type for the plugin data.
			class InferType<S extends Schema.Struct<any>> {
				readonly _Schema: S;
				constructor(schema: S) {
					this._Schema = schema;
				}
				readonly usePluginData!: S;
				readonly Insert!: RecursiveSimplifyMutable<S['Type']>;
			}

			return {
				/**
				 * Provides a set of effectful operations for managing plugin data entries by plugin ID and optional entry ID.
				 *
				 * When an `entryId` is provided, returns an object with methods to:
				 * - Generate a unique plugin data entry ID.
				 * - Insert new plugin data after validation and duplicate checks.
				 * - Select and validate existing plugin data by ID.
				 * - Update existing plugin data after validation.
				 *
				 * When no `entryId` is provided, returns an object with a method to retrieve all entries for the given plugin.
				 *
				 * @param pluginId - The unique identifier for the plugin.
				 * @param entryId - (Optional) The unique identifier for the plugin data entry.
				 * @returns An object with effectful methods for plugin data management, varying by presence of `entryId`.
				 */
				usePluginData,

				/**
				 * Initializes the plugin data cache by fetching all existing entries from the database
				 * and populating the in-memory cache with these entries.
				 */
				initPluginDataCache,

				/**
				 * Clears the plugin data cache, removing all cached entries.
				 *
				 * @returns An Effect that resolves to `void` on success or an `Error` on failure.
				 */
				clearPluginDataCache,

				/**
				 * Utility class to infer types from a given Schema.
				 *
				 * @typeParam S - The schema type extending `Schema.Struct<any>`.
				 *
				 * @property _Schema - The schema instance used for type inference.
				 * @property usePluginData - The inferred type from the schema, used for plugin data.
				 * @property Insert - A recursively simplified, mutable version of the schema's type.
				 *
				 */
				InferType,
			};
		}),
	}
) {}
