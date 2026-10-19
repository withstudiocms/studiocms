import { Effect, Schema } from '@withstudiocms/effect';
import CacheService from '../../cache.js';
import { cacheKeyGetters, cacheTags } from '../../consts.js';
import { DBClientLive } from '../../context.js';
import { StudioCMSSDKError } from '../../errors.js';
import {
	type PluginDataEntry,
	parseData,
	parsedDataResponse,
	type RecursiveSimplifyMutable,
	SelectPluginDataRespondOrFail,
	type UsePluginDataOpts,
	type UsePluginDataOptsBase,
	type UserPluginDataOptsImplementation,
	type ValidatorOptions,
} from '../../lib/pluginUtils.js';
import { StudioCMSPluginData } from '../../tables.js';
import type { tsPluginData } from '../../types.js';

/**
 * Cache key and options for plugin data caching.
 */
const cacheKey = cacheKeyGetters.plugins;

/**
 * Cache options for plugin data caching.
 */
const cacheOpts = { tags: cacheTags.plugins };

/**
 * SDKPluginsModule
 *
 * Effect-based module that provides a complete set of utilities for managing plugin-scoped
 * data entries persisted in the `StudioCMSPluginData` table and cached in an application cache.
 * The module is implemented as an Effect.gen and depends on a database client and a cache
 * service. It combines typed codecs, validation, database operations, and caching/memoization
 * to provide a safe and ergonomic API for plugin authors.
 *
 * Key responsibilities
 * - Database access:
 *   - Batched reads of plugin data for cache initialization.
 *   - Select, insert and update operations for single plugin data entries.
 *   - All DB operations are wrapped with codecs to validate/encode inputs and decode results.
 *
 * - Caching:
 *   - Per-entry memoization via a cache key derived from the plugin+entry id.
 *   - Batch cache population via `initPluginDataCache`.
 *   - Cache invalidation support via `clearPluginDataCache` (invalidates plugin tags).
 *   - Cache entries include a shared timestamp for a single initialization run.
 *
 * - Validation and parsing:
 *   - Data payloads are parsed and optionally validated with provided validator options
 *     before being inserted/updated or returned to callers.
 *   - Helpers wrap parsed results into a consistent `PluginDataEntry<T>` response.
 *
 * Public API (returned object)
 * - usePluginData(pluginId, opts?)
 *   Overloaded function:
 *   1) usePluginData(pluginId, opts?: UsePluginDataOptsBase<T>)
 *      - Returns:
 *        - getEntries(filter?) => Effect<PluginDataEntry<R>[], Error, never>
 *          Retrieves all entries for a pluginId, optionally applying an in-memory filter
 *          after validation and parsing.
 *        - getEntry(id) => builder object (generatedId, select, insert, update)
 *          Returns a per-entry builder for convenience when working with many entries.
 *
 *   2) usePluginData(pluginId, opts?: UsePluginDataOpts<T>)  (when entryId provided in opts)
 *      - Returns a per-entry API:
 *        - generatedId(): Effect<string, never, never> -- returns `${pluginId}-${entryId}`.
 *        - select(): Effect<PluginDataEntry<R> | undefined, Error, never> -- reads, validates and returns parsed data.
 *        - insert(data: R): Effect<PluginDataEntry<R>, Error, never> -- validates and inserts a new entry.
 *        - update(data: R): Effect<PluginDataEntry<R>, Error, never> -- validates and updates an existing entry.
 *
 *   - Generic behavior:
 *     - `T` is the schema or object type used for validation.
 *     - `R` is the resolved/public type used in returned `PluginDataEntry<R>`.
 *     - All operations return Effects and preserve typed validation semantics.
 *
 * - initPluginDataCache(BATCH_SIZE)
 *   - Walks the `StudioCMSPluginData` table in batches and populates the cache with
 *     all existing entries. Uses a single timestamp for each initialization run to
 *     mark `lastCacheUpdate` consistently across entries.
 *   - Batch size defaults and safety: accepts a batch size, coerces non-positive values
 *     to a sane default (e.g. 100).
 *
 * - clearPluginDataCache()
 *   - Invalidates cache entries for plugin data using configured cache tags.
 *
 * - InferType<S extends Schema.Struct<any>>
 *   - Utility class for inferring and re-exporting schema-derived types (e.g. the
 *     simplified/recursive `Insert` type) to help consumers derive correct generics
 *     for `usePluginData`.
 *
 * Error semantics
 * - DB/validation errors are surfaced as Effect failures (Error).
 * - Insert/update operations perform existence checks and will fail on duplicate inserts
 *   or updates to non-existent entries (controlled internally via SelectPluginDataRespondOrFail).
 *
 * Implementation notes (high-level)
 * - DB interactions are performed via a `withCodec` wrapper that enforces input/output
 *   shapes at the codec boundary.
 * - Per-entry caching is implemented using `memoize(cacheKey(id), dbCall, cacheOpts)`.
 * - Initialization uses a batched DB query and writes entries into the cache via `set`.
 * - Processing path for DB entries:
 *   1) Read raw DB entry (JSON string payload).
 *   2) parseData -> validate (if validator provided).
 *   3) Wrap into consistent `PluginDataEntry<T>` response.
 *
 * Example usage
 * @example
 * // Get all entries for plugin "com.example"
 * const sdk = yield* SDKPluginsModule;
 * const getAll = sdk.usePluginData('com.example');
 * const entries = yield* getAll.getEntries();
 *
 * // Work with a specific entry
 * const entryApi = sdk.usePluginData('com.example', { entryId: 'myEntry', validator: mySchema });
 * const existing = yield* entryApi.select();
 * const inserted = yield* entryApi.insert({ foo: 'bar' });
 *
 * Thread-safety & concurrency
 * - Cache and DB operations are effectful and composable; callers should coordinate
 *   concurrent modifications as needed (e.g. optimistic strategies) depending on application needs.
 *
 * Notes for contributors
 * - Keep codecs and validators up-to-date with DB schema.
 * - Ensure cache tag names and key generation remain stable to avoid stale cache bugs.
 */
export const SDKPluginsModule = Effect.gen(function* () {
	const [{ withCodec }, { memoize, invalidateTags, set }] = yield* Effect.all([
		DBClientLive,
		CacheService,
	]);

	// ============================================
	// DB Operations
	// ============================================

	/**
	 * Batch request to fetch plugin data from the database.
	 *
	 * This function retrieves a batch of plugin data records from the StudioCMSPluginData table
	 * based on the specified batch size and offset. It uses a codec to encode the input parameters
	 * and decode the resulting records.
	 *
	 * @param batchSize - The number of records to fetch in the batch.
	 * @param offset - The offset from which to start fetching records.
	 * @returns An array of StudioCMSPluginData records.
	 */
	const _dbBatchRequest = withCodec({
		encoder: Schema.Struct({
			batchSize: Schema.Number,
			offset: Schema.Number,
		}),
		decoder: Schema.Array(StudioCMSPluginData.Select),
		callbackFn: (db, { batchSize, offset }) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPluginData')
					.selectAll()
					.limit(batchSize)
					.offset(offset)
					.execute()
			),
	});

	/**
	 * Get all plugin data entries for a specific plugin ID.
	 *
	 * This function retrieves all plugin data entries associated with the given plugin ID
	 * from the StudioCMSPluginData table. It uses a codec to encode the plugin ID and decode
	 * the resulting records.
	 *
	 * @param pluginId - The ID of the plugin whose data entries are to be fetched.
	 * @returns An array of StudioCMSPluginData records for the specified plugin ID.
	 */
	const _dbGetEntriesPluginData = withCodec({
		encoder: Schema.String,
		decoder: Schema.Array(StudioCMSPluginData.Select),
		callbackFn: (db, pluginId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPluginData')
					.selectAll()
					.where('id', 'like', `${pluginId}-%`)
					.execute()
			),
	});

	/**
	 * Select a single plugin data entry by its entry ID.
	 *
	 * This function retrieves a single plugin data entry from the StudioCMSPluginData table
	 * based on the specified entry ID. It uses a codec to encode the entry ID and decode
	 * the resulting record.
	 *
	 * @param entryId - The ID of the plugin data entry to be fetched.
	 * @returns The StudioCMSPluginData record for the specified entry ID, or undefined if not found.
	 */
	const _dbSelectPluginDataEntry = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSPluginData.Select),
		callbackFn: (db, entryId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPluginData')
					.selectAll()
					.where('id', '=', entryId)
					.executeTakeFirst()
			),
	});

	/**
	 * Insert a new plugin data entry into the database.
	 *
	 * This function inserts a new plugin data entry into the StudioCMSPluginData table.
	 * It uses a codec to encode the input entry and decode the resulting record.
	 *
	 * @param entry - The plugin data entry to be inserted.
	 * @returns The inserted StudioCMSPluginData record.
	 */
	const _dbInsertPluginDataEntry = withCodec({
		encoder: StudioCMSPluginData.Insert,
		decoder: StudioCMSPluginData.Select,
		callbackFn: (db, entry) =>
			db((client) =>
				client.transaction().execute(async (trx) => {
					await trx.insertInto('StudioCMSPluginData').values(entry).executeTakeFirstOrThrow();

					return await trx
						.selectFrom('StudioCMSPluginData')
						.selectAll()
						.where('id', '=', entry.id)
						.executeTakeFirstOrThrow();
				})
			),
	});

	/**
	 * Update an existing plugin data entry in the database.
	 *
	 * This function updates an existing plugin data entry in the StudioCMSPluginData table.
	 * It uses a codec to encode the input entry and decode the resulting record.
	 *
	 * @param entry - The plugin data entry to be updated.
	 * @returns The updated StudioCMSPluginData record.
	 */
	const _dbUpdatePluginDataEntry = withCodec({
		encoder: StudioCMSPluginData.Update,
		decoder: StudioCMSPluginData.Select,
		callbackFn: (db, entry) =>
			db((client) =>
				client.transaction().execute(async (trx) => {
					await trx
						.updateTable('StudioCMSPluginData')
						.set(entry)
						.where('id', '=', entry.id)
						.executeTakeFirstOrThrow();

					return await trx
						.selectFrom('StudioCMSPluginData')
						.selectAll()
						.where('id', '=', entry.id)
						.executeTakeFirstOrThrow();
				})
			),
	});

	// ============================================
	// Helpers
	// ============================================

	/**
	 * Initialize the plugin data cache by batching requests to the database
	 * and populating the cache with the retrieved entries.
	 *
	 * @param BATCH_SIZE - The number of entries to fetch in each batch.
	 */
	const _initPluginDataCache = Effect.fn((BATCH_SIZE?: number) =>
		Effect.gen(function* () {
			let batchSize = BATCH_SIZE || 100; // Default batch size if not provided
			if (batchSize <= 0) {
				batchSize = 100; // Ensure a positive batch size
			}
			let offset = 0;
			const sharedTimestamp = new Date(); // Single timestamp for all entries

			while (true) {
				const entries = yield* _dbBatchRequest({ batchSize, offset });

				if (entries.length === 0) break;

				// Batch insert into cache
				const cacheEntries = entries.map(
					(entry) => [entry.id, { data: entry, lastCacheUpdate: sharedTimestamp }] as const
				);

				// Use Map constructor or batch set operations
				for (const [id, cacheData] of cacheEntries) {
					yield* set(cacheKey(id), cacheData, cacheOpts);
				}

				offset += batchSize;
			}
		})
	);

	/**
	 * Clear all plugin data entries from the cache.
	 */
	const _clearPluginDataCache = Effect.fn(() => invalidateTags(cacheTags.plugins));

	/**
	 * Select a plugin data entry from the cache by its ID.
	 *
	 * @param id - The ID of the plugin data entry to select.
	 * @returns The cached plugin data entry, or undefined if not found.
	 */
	const _selectPluginDataEntry = Effect.fn((id: string) =>
		memoize(cacheKey(id), _dbSelectPluginDataEntry(id), cacheOpts)
	);

	/**
	 * Insert a plugin data entry into the cache and database.
	 *
	 * @param data - The plugin data entry to insert.
	 * @returns The inserted plugin data entry.
	 */
	const _insertPluginDataEntry = Effect.fn((data: typeof StudioCMSPluginData.Insert.Type) =>
		memoize(cacheKey(data.id), _dbInsertPluginDataEntry(data), cacheOpts)
	);

	/**
	 * Update a plugin data entry in the cache and database.
	 *
	 * @param data - The plugin data entry to update.
	 * @returns The updated plugin data entry.
	 */
	const _updatePluginDataEntry = Effect.fn((data: typeof StudioCMSPluginData.Update.Type) =>
		memoize(cacheKey(data.id), _dbUpdatePluginDataEntry(data), cacheOpts)
	);

	/**
	 * Process a plugin data entry retrieved from the database,
	 * validating its data using the provided validator if available.
	 */
	const _processEntryFromDB = Effect.fn(
		<T extends Schema.Struct<Schema.Struct.Fields> | object>(
			entry: tsPluginData['Select']['Type'],
			validator?: ValidatorOptions<T>
		) =>
			parseData<T>(entry.data, validator).pipe(
				Effect.flatMap((validated) => parsedDataResponse<T>(entry.id, validated))
			)
	);

	/**
	 * Process multiple plugin data entries retrieved from the database,
	 * validating their data using the provided validator if available.
	 */
	const _processPluginDataDBEntries = <T extends Schema.Struct<Schema.Struct.Fields> | object>(
		validator?: ValidatorOptions<T>
	) =>
		Effect.fn((entries: readonly tsPluginData['Select']['Type'][]) =>
			Effect.all(entries.map((entry) => _processEntryFromDB<T>(entry, validator)))
		);

	/**
	 * Filter processed plugin data entries using an optional filter function.
	 */
	const _filterProcessedEntries =
		<T extends Schema.Struct<Schema.Struct.Fields> | object>(
			filter?: (data: PluginDataEntry<T>[]) => PluginDataEntry<T>[]
		) =>
		(entries: PluginDataEntry<T>[]) =>
			filter ? filter(entries) : entries;

	/**
	 * Get plugin data entries for a specific plugin ID,
	 * validating and filtering them as needed.
	 */
	const _getEntries = Effect.fn(
		<T extends Schema.Struct<Schema.Struct.Fields> | object>(
			pluginId: string,
			validator?: ValidatorOptions<T>,
			filter?: (data: PluginDataEntry<T>[]) => PluginDataEntry<T>[]
		) =>
			_dbGetEntriesPluginData(pluginId).pipe(
				Effect.flatMap(_processPluginDataDBEntries<T>(validator)),
				Effect.map(_filterProcessedEntries<T>(filter))
			)
	);

	/**
	 * Select a plugin data entry and respond or fail based on its existence and the specified mode.
	 */
	const _selectPluginDataEntryRespondOrFail = Effect.fn(function* (
		id: string,
		mode: SelectPluginDataRespondOrFail
	) {
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
					return yield* new StudioCMSSDKError({
						message: `Plugin data with ID ${id} already exists.`,
					});
				// If it does not exist, return undefined
				return undefined;
			}
			case SelectPluginDataRespondOrFail.NotExistsShouldFail: {
				// If it does not exist, fail with an error
				if (!existing)
					return yield* new StudioCMSSDKError({
						message: `Plugin data with ID ${id} does not exist.`,
					});
				// If it exists, return undefined
				return undefined;
			}
			default:
				return yield* new StudioCMSSDKError({ message: `Invalid mode: ${mode}` });
		}
	});

	/**
	 * Select a plugin data entry, validate it, and return the parsed data response.
	 */
	const _select = Effect.fn(function* <T extends Schema.Struct<Schema.Struct.Fields> | object>(
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
	 * Insert a new plugin data entry after validating it,
	 * ensuring no duplicate entries exist.
	 */
	const _insert = Effect.fn(function* <T extends Schema.Struct<Schema.Struct.Fields> | object>(
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
			data: JSON.stringify(parsedData),
		});

		// Return the inserted data
		return yield* parsedDataResponse<T>(inserted.id, parsedData);
	});

	/**
	 * Update an existing plugin data entry after validating it,
	 * ensuring the entry exists before attempting the update.
	 */
	const _update = Effect.fn(function* <T extends Schema.Struct<Schema.Struct.Fields> | object>(
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
			data: JSON.stringify(parsedData),
		});

		// Return the parsed data response for the updated record
		return yield* parsedDataResponse<T>(updated.id, parsedData);
	});

	/**
	 * Builds and returns an object containing methods to manage plugin data entries
	 * for a specific plugin and entry ID, including generating IDs, selecting,
	 * inserting, and updating entries with optional validation.
	 *
	 * @param pluginId - The ID of the plugin.
	 * @param entryId - The specific entry ID within the plugin.
	 * @param validator - Optional. A validator to validate the plugin data.
	 * @returns An object with methods to manage the plugin data entry.
	 */
	const buildReturn = <T extends Schema.Struct<Schema.Struct.Fields> | object>(
		pluginId: string,
		entryId: string,
		validator?: ValidatorOptions<T>
	) => {
		const generatedEntryId = `${pluginId}-${entryId}`;
		return {
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
		};
	};

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
		getEntries: (
			filter?: (data: PluginDataEntry<R>[]) => PluginDataEntry<R>[]
		) => Effect.Effect<PluginDataEntry<R>[], StudioCMSSDKError, never>;
		getEntry: (id: string) => {
			generatedId: () => Effect.Effect<string, never, never>;
			select: () => Effect.Effect<PluginDataEntry<R> | undefined, StudioCMSSDKError, never>;
			insert: (data: R) => Effect.Effect<PluginDataEntry<R>, StudioCMSSDKError, never>;
			update: (data: R) => Effect.Effect<PluginDataEntry<R>, StudioCMSSDKError, never>;
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
		select: () => Effect.Effect<PluginDataEntry<R> | undefined, StudioCMSSDKError, never>;
		insert: (data: R) => Effect.Effect<PluginDataEntry<R>, StudioCMSSDKError, never>;
		update: (data: R) => Effect.Effect<PluginDataEntry<R>, StudioCMSSDKError, never>;
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
				getEntries: (filter?: (data: PluginDataEntry<T>[]) => PluginDataEntry<T>[]) =>
					_getEntries<T>(pluginId, validator, filter),
				getEntry: (id: string) => buildReturn<T>(pluginId, id, validator),
			};
		}
		return buildReturn<T>(pluginId, entryId, validator);
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
	class InferType<
		// biome-ignore lint/suspicious/noExplicitAny: as this is a generic type for the plugin data.
		S extends Schema.Struct<any>,
		R = RecursiveSimplifyMutable<S['Type']>,
	> {
		readonly _Schema: S;
		readonly $UsePluginData!: S;
		readonly $Insert!: R;
		constructor(schema: S) {
			if (!schema || !Schema.isSchema(schema)) {
				throw new Error('InferType requires a valid Schema.Struct instance.');
			}
			this._Schema = schema;
		}
	}

	// ============================================
	// Exposed Module Functions
	// ============================================

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
		initPluginDataCache: _initPluginDataCache,

		/**
		 * Clears the plugin data cache, removing all cached entries.
		 *
		 * @returns An Effect that resolves to `void` on success or an `Error` on failure.
		 */
		clearPluginDataCache: _clearPluginDataCache,

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
});

export default SDKPluginsModule;
