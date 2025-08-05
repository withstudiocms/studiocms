import { eq, like } from 'astro:db';
import { type Cause, Effect, genLogger, pipe } from '../../effect.js';
import { AstroDB, type LibSQLDatabaseError } from '../effect/db.js';
import {
	parseData,
	parsedDataResponse,
	SelectPluginDataRespondOrFail,
} from '../effect/pluginUtils.js';
import { tsPluginData } from '../tables.js';
import type {
	PluginDataEntry,
	tsPluginDataInsert,
	tsPluginDataSelect,
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
			 * Executes a database query to select a single plugin data entry by its ID.
			 *
			 * @param query - The database query function.
			 * @param id - The unique identifier of the plugin data entry to retrieve.
			 * @returns The plugin data entry matching the provided ID, or undefined if not found.
			 */
			const _rawSelectPluginDataEntry = dbService.makeQuery((query, id: string) =>
				query((db) => db.select().from(tsPluginData).where(eq(tsPluginData.id, id)).get())
			);

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
			const _selectPluginDataEntry = Effect.fn(function* (id: string) {
				if (yield* isCacheEnabled) {
					// Check the cache for the plugin data entry
					const cached = pluginData.get(id);
					if (cached && !isCacheExpired(cached)) {
						const { data: cacheData } = cached;
						// If the entry is found in the cache and is not expired, return it
						return { id: cacheData.id, data: cacheData.data };
					}

					// If the entry is not found in the cache or is expired, query the database
					// and update the cache with the new data
					const fresh = yield* _rawSelectPluginDataEntry(id);
					if (fresh) {
						pluginData.set(id, { data: fresh, lastCacheUpdate: new Date() });
					}
					return fresh;
				}

				// If caching is not enabled, directly query the database
				// This ensures that we always get the latest data from the database
				return yield* _rawSelectPluginDataEntry(id);
			});

			/**
			 * Inserts a new plugin data entry into the database and returns the inserted record.
			 *
			 * @param data - The plugin data to be inserted, conforming to the `tsPluginDataInsert` type.
			 * @returns A promise that resolves to the inserted plugin data record.
			 *
			 * @example
			 * ```typescript
			 * const newPlugin = await _rawInsertPluginDataEntry({ name: "MyPlugin", version: "1.0.0" });
			 * ```
			 */
			const _rawInsertPluginDataEntry = dbService.makeQuery((query, data: tsPluginDataInsert) =>
				query((db) => db.insert(tsPluginData).values(data).returning().get())
			);

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
			const _insertPluginDataEntry = Effect.fn(function* (data: tsPluginDataInsert) {
				// Insert the plugin data entry into the database
				const newData = yield* _rawInsertPluginDataEntry(data);

				// If caching is enabled, update the cache with the new data
				// This ensures that the cache is always in sync with the database
				if (yield* isCacheEnabled) {
					pluginData.set(newData.id, { data: newData, lastCacheUpdate: new Date() });
				}

				// Return the newly inserted data
				return newData;
			});

			/**
			 * Updates an existing plugin data entry in the database.
			 *
			 * @param query - The database query executor function.
			 * @param data - The plugin data object containing updated fields, including the `id` of the entry to update.
			 * @returns A promise that resolves to the updated entry's `id`.
			 *
			 * @private
			 * @remarks
			 * This function is used internally to update plugin data entries.
			 * It returns the updated entry's `id` as part of the result.
			 */
			const _rawUpdatePluginDataEntry = dbService.makeQuery((query, data: tsPluginDataSelect) =>
				query((db) =>
					db.update(tsPluginData).set(data).where(eq(tsPluginData.id, data.id)).returning().get()
				)
			);

			/**
			 * Updates a plugin data entry in the database and, if caching is enabled, updates the cache with the new data.
			 *
			 * @param data - The plugin data entry to update.
			 * @returns The updated plugin data entry.
			 *
			 * @remarks
			 * This function performs the update operation using `_rawUpdatePluginDataEntry`. If caching is enabled,
			 * it also updates the in-memory cache with the new data and the current timestamp.
			 */
			const _updatePluginDataEntry = Effect.fn(function* (data: tsPluginDataSelect) {
				// Update the plugin data entry in the database
				const updatedData = yield* _rawUpdatePluginDataEntry(data);

				// If caching is enabled, update the cache with the new data
				if (yield* isCacheEnabled) {
					pluginData.set(updatedData.id, { data: updatedData, lastCacheUpdate: new Date() });
				}

				// Return the updated data
				return updatedData;
			});

			/**
			 * Retrieves plugin data entries from the database whose IDs match the specified plugin ID prefix.
			 *
			 * @param query - The database query function.
			 * @param pluginId - The unique identifier of the plugin. Used as a prefix to filter entries.
			 * @returns A promise resolving to an array of plugin data entries whose IDs start with the given pluginId followed by a hyphen.
			 */
			const _getEntriesPluginData = dbService.makeQuery((query, pluginId: string) =>
				query((db) =>
					db
						.select()
						.from(tsPluginData)
						.where(like(tsPluginData.id, `${pluginId}-%`))
				)
			);

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
			const _getEntries = Effect.fn(function* <T extends object>(
				pluginId: string,
				validator?: ValidatorOptions<T>
			) {
				if (yield* isCacheEnabled) {
					const mappableEntries = Array.from(pluginData.entries()).filter(([key]) =>
						key.startsWith(pluginId)
					);

					const data = yield* pipe(mappableEntries, (entries) =>
						Effect.forEach(entries, ([_, { data: entry, lastCacheUpdate }]) =>
							Effect.gen(function* () {
								if ((yield* isCacheEnabled) && isCacheExpired({ lastCacheUpdate })) {
									// If the cache is expired, we need to fetch the latest data from the database
									const freshEntry = yield* _rawSelectPluginDataEntry(entry.id);

									if (freshEntry) {
										// If the entry is found in the database, update the cache
										pluginData.set(entry.id, {
											data: freshEntry,
											lastCacheUpdate: new Date(),
										});
										const validated = yield* parseData<T>(freshEntry.data, validator);
										return yield* parsedDataResponse<T>(entry.id, validated);
									}
								}

								// If the entry is not expired or not found in the database, return the cached data
								const validated = yield* parseData<T>(entry.data, validator);
								return yield* parsedDataResponse<T>(entry.id, validated);
							})
						)
					);

					// If no entries are found in the cache, attempt to fetch from the database
					// This is useful for cases where the cache might be empty or expired
					// and we want to ensure we have the latest data available
					if (data.length === 0) {
						return yield* pipe(
							_getEntriesPluginData(pluginId),
							Effect.flatMap((entries) =>
								Effect.forEach(entries, (entry) =>
									Effect.gen(function* () {
										const validated = yield* parseData<T>(entry.data, validator);

										pluginData.set(entry.id, {
											data: entry,
											lastCacheUpdate: new Date(),
										});
										return yield* parsedDataResponse<T>(entry.id, validated);
									})
								)
							)
						);
					}

					return data;
				}

				// If caching is not enabled, directly query the database
				return yield* pipe(
					_getEntriesPluginData(pluginId),
					Effect.flatMap((entries) =>
						Effect.forEach(entries, (entry) =>
							Effect.gen(function* () {
								const validated = yield* parseData<T>(entry.data, validator);
								return yield* parsedDataResponse<T>(entry.id, validated);
							})
						)
					)
				);
			});

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
				'studiocms/sdk/SDKCore/modules/plugins/effect/usePluginData._selectPluginDataEntryRespondOrFail'
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
					default:
						return yield* Effect.fail(new Error(`Invalid mode: ${mode}`));
				}
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
			function usePluginData(pluginId: string): {
				getEntries: <T extends object>(
					validator?: ValidatorOptions<T>
				) => Effect.Effect<PluginDataEntry<T>[], LibSQLDatabaseError | Error, never>;
			};

			/**
			 * Retrieves or manipulates plugin data entries for a specific plugin ID and entry ID.
			 *
			 * @param pluginId - The unique identifier for the plugin.
			 * @param entryId - (Optional) The unique identifier for the plugin data entry.
			 * @returns An object with methods to manage plugin data entries.
			 */
			function usePluginData(
				pluginId: string,
				entryId: string
			): {
				generatedId: () => Effect.Effect<string, never, never>;
				insert: <T extends object>(
					data: T,
					validator?: ValidatorOptions<T>
				) => Effect.Effect<PluginDataEntry<T>, Cause.UnknownException, never>;
				select: <T extends object>(
					validator?: ValidatorOptions<T>
				) => Effect.Effect<PluginDataEntry<T> | undefined, Cause.UnknownException, never>;
				update: <T extends object>(
					data: T,
					validator?: ValidatorOptions<T>
				) => Effect.Effect<PluginDataEntry<T>, Cause.UnknownException, never>;
			};

			/**
			 * Implementation of the `usePluginData` function that provides access to plugin data entries.
			 */
			function usePluginData(pluginId: string, entryId?: string) {
				if (!entryId) {
					return {
						/**
						 * Retrieves all plugin data entries for the specified plugin ID.
						 *
						 * @template T - The type of the plugin data object.
						 * @param validator - Optional validator options for validating the plugin data.
						 * @returns An Effect that yields an array of `PluginDataEntry<T>` objects.
						 */
						getEntries: <T extends object>(validator?: ValidatorOptions<T>) =>
							_getEntries(pluginId, validator),
					};
				}

				// If entryId is provided, we create a unique ID for the plugin data entry
				// This ID is a combination of the pluginId and entryId to ensure uniqueness
				// This allows us to manage specific entries for a plugin
				// The ID is used to perform CRUD operations on the plugin data entry
				// This is useful for cases where a plugin needs to store multiple entries
				// or manage specific data associated with a plugin instance
				const generatedEntryId = `${pluginId}-${entryId}`;

				return {
					/**
					 * Generates a unique ID for the plugin data entry.
					 *
					 * @returns An Effect that yields the generated ID.
					 */
					generatedId: () => Effect.succeed(generatedEntryId),

					/**
					 * Inserts new plugin data into the database after validating and checking for duplicate IDs.
					 *
					 * @template T - The type of the plugin data object.
					 * @param data - The plugin data to insert.
					 * @param validator - Optional validator options for validating the plugin data.
					 * @yields Throws an error if plugin data with the given ID already exists.
					 * @yields Throws an error if validation fails.
					 * @returns The parsed data response for the newly inserted entry.
					 */
					insert: Effect.fn('studiocms/sdk/SDKCore/modules/plugins/effect/usePluginData.insert')(
						function* <T extends object>(data: T, validator?: ValidatorOptions<T>) {
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
								// @ts-expect-error - drizzle broke the 'id' type
								id: generatedEntryId,
								data: parsedData,
							});

							// Return the inserted data
							return inserted;
						}
					),

					/**
					 * Selects and validates plugin data by ID.
					 *
					 * This generator function checks if plugin data exists for the given ID,
					 * validates and parses the data using the provided validator, and returns
					 * a parsed data response. If no data exists for the given ID, it returns `undefined`.
					 *
					 * @template T - The expected shape of the plugin data.
					 * @param validator - Optional validation options for parsing the plugin data.
					 * @returns The parsed data response for the existing entry, or `undefined` if not found.
					 */
					select: Effect.fn('studiocms/sdk/SDKCore/modules/plugins/effect/usePluginData.select')(
						function* <T extends object>(validator?: ValidatorOptions<T>) {
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
						}
					),

					/**
					 * Updates the plugin data for a given ID after validating the input.
					 *
					 * This function performs the following steps:
					 * 1. Checks if the plugin data with the specified ID exists.
					 * 2. If not found, fails with an error.
					 * 3. Validates the provided data using the optional validator.
					 * 4. Updates the database record with the validated data.
					 * 5. Returns the parsed data response for the updated record.
					 *
					 * @template T - The shape of the plugin data object.
					 * @param data - The new data to update for the plugin.
					 * @param validator - (Optional) Validation options for the data.
					 * @yields Throws an error if the plugin data with the given ID does not exist or if validation fails.
					 * @returns The parsed data response for the updated plugin record.
					 */
					update: Effect.fn('studiocms/sdk/SDKCore/modules/plugins/effect/usePluginData.update')(
						function* <T extends object>(data: T, validator?: ValidatorOptions<T>) {
							// Check if the plugin data with the given ID exists
							// If it does not exist, fail with an error
							// This ensures that we only update existing records
							// and prevents accidental creation of new records
							// when trying to update non-existing data
							yield* _selectPluginDataEntryRespondOrFail(
								generatedEntryId,
								SelectPluginDataRespondOrFail.ExistsShouldFail
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
						}
					),
				};
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
			};
		}),
	}
) {}
