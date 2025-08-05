import { eq, like } from 'astro:db';
import type { z } from 'astro/zod';
import type { UnknownException } from 'effect/Cause';
import type { ParseError } from 'effect/ParseResult';
import { Effect, genLogger, Schema } from '../../effect.js';
import { AstroDB, type LibSQLDatabaseError } from '../effect/db.js';
import { tsPluginData } from '../tables.js';

export type tsPluginDataInsert = typeof tsPluginData.$inferInsert;
export type tsPluginDataSelect = typeof tsPluginData.$inferSelect;

/**
 * Represents a plugin data entry with a strongly-typed `data` property.
 *
 * @template T - The type of the `data` property.
 * @extends Omit<tsPluginDataSelect, 'data'>
 * @property {T} data - The plugin-specific data payload.
 */
export interface PluginDataEntry<T extends object> extends Omit<tsPluginDataSelect, 'data'> {
	data: T;
}

/**
 * Wraps the provided `id` and `data` into a `PluginDataEntry<T>` object and returns it as an Effect.
 *
 * @template T - The type of the data to be wrapped.
 * @param id - The unique identifier for the plugin data entry.
 * @param data - The data to be associated with the given id.
 * @returns An Effect that, when executed, yields a `PluginDataEntry<T>` containing the provided id and data.
 */
export const parsedDataResponse = <T extends object>(
	id: string,
	data: T
): Effect.Effect<PluginDataEntry<T>, UnknownException, never> =>
	Effect.try(() => ({
		id,
		data,
	}));

export interface JSONValidatorFn<T> {
	jsonFn: (data: unknown) => data is T;
}

export interface EffectSchemaValidator<T> {
	effectSchema: Schema.Schema<T, ParseError, never>;
}

export interface ZodValidator<T> {
	zodSchema: z.ZodSchema<T>;
}

/**
 * Represents the available validator options for a given type `T`.
 *
 * This type is a union of supported validator types:
 * - `JSONValidatorFn<T>`: A function-based JSON validator for type `T`.
 * - `EffectSchemaValidator<T>`: A validator using the Effect schema for type `T`.
 * - `ZodValidator<T>`: A validator using the Zod schema for type `T`.
 *
 * @template T - The type to be validated.
 *
 * @example
 * ```typescript
 * // The Interface for a User type
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * // Example of defining a JSON validator Fn for a User type
 * const userValidator: ValidatorOptions<User> = {
 *   jsonFn: (data: unknown): data is User => {
 *     return (
 *       typeof data === 'object' &&
 *       data !== null &&
 *       'id' in data &&
 *       'name' in data &&
 *       'email' in data &&
 *       typeof (data as any).id === 'number' &&
 *       typeof (data as any).name === 'string' &&
 *       typeof (data as any).email === 'string'
 *     );
 *   }
 * };
 *
 * // Example of defining an Effect schema validator for a User type
 * import { Schema } from 'studiocms/effect';
 *
 * const userEffectValidator: ValidatorOptions<User> = {
 *   effectSchema: Schema.Struct({
 *     id: Schema.Number,
 *     name: Schema.String,
 *     email: Schema.String
 *   })
 * };
 *
 * // Example of defining a Zod validator for a User type
 * import { z } from 'astro/zod';
 *
 * const userZodValidator: ValidatorOptions<User> = {
 *   zodSchema: z.object({
 *     id: z.number(),
 *     name: z.string(),
 *     email: z.string()
 *   })
 * };
 * ```
 */
export type ValidatorOptions<T> = JSONValidatorFn<T> | EffectSchemaValidator<T> | ZodValidator<T>;

/**
 * Parses and validates plugin data from a raw input, supporting multiple validation strategies.
 *
 * This function attempts to parse the provided `rawData`, which can be either a JSON string or an object.
 * If a validator is provided, it validates the parsed data using one of the supported validation methods:
 * - JSON function (`jsonFn`)
 * - Effect schema (`effectSchema`)
 * - Zod schema (`zodSchema`)
 *
 * If no validator is provided, the parsed data is returned as is.
 * If validation fails or the input format is invalid, an error is yielded.
 *
 * @typeParam T - The expected type of the parsed and validated data.
 * @param rawData - The raw input data, which can be a JSON string or an object.
 * @param validator - Optional. An object specifying the validation strategy to use.
 * @returns An `Effect` yielding the parsed and validated data of type `T`, or an error if parsing or validation fails.
 *
 * @throws {Error} If the input is neither a string nor an object, or if parsing/validation fails.
 */
export const parseData = Effect.fn('studiocms/sdk/SDKCore/modules/plugins/parseData')(function* <
	T extends object,
>(rawData: unknown, validator?: ValidatorOptions<T>) {
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

	if (!validator || validator === undefined) {
		// If no options are provided, return the parsed input as is
		return parsedInput as T;
	}

	if ('jsonFn' in validator) {
		// Validate using JSON validator
		if (!validator.jsonFn(parsedInput)) {
			return yield* Effect.fail(new Error('Data validation failed'));
		}

		// If validation passes, return the parsed input
		// This will be of type T, as ensured by the validator
		return parsedInput;
	}

	if ('effectSchema' in validator) {
		// Use the Schema to validate the parsed input
		// If validation fails, it will throw an error
		// If it passes, it will return the parsed input as type T
		// We use `decodeUnknown` to handle unknown input types
		// and ensure it matches the schema
		return yield* Schema.decodeUnknown(validator.effectSchema)(parsedInput).pipe(
			Effect.mapError((error) => new Error(`Schema validation failed: ${error}`))
		);
	}

	if ('zodSchema' in validator) {
		// Validate using Zod
		const result = validator.zodSchema.safeParse(parsedInput);

		// If validation fails, return an error
		if (!result.success) {
			return yield* Effect.fail(new Error(`Zod validation failed: ${result.error.message}`));
		}

		// If it passes, return the parsed input as type T
		return result.data;
	}

	return yield* Effect.fail(
		new Error('Invalid validator options provided, expected one of: json, effectSchema, or zod')
	);
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
			 * Creates a function to check for the existence of a plugin entry by its ID in the database.
			 *
			 * @param toCheck - The ID of the plugin entry to check for.
			 * @returns The plugin entry data if found, otherwise undefined.
			 *
			 * @example
			 * const plugin = await checkForId('plugin-id');
			 * if (plugin) {
			 *   // Plugin exists
			 * }
			 */
			const _selectPageDataEntry = dbService.makeQuery((query, id: string) =>
				query((db) => db.select().from(tsPluginData).where(eq(tsPluginData.id, id)).get())
			);

			/**
			 * Inserts a new plugin data entry into the database.
			 *
			 * @param query - The database query executor function.
			 * @param data - The plugin data to insert, conforming to the `tsPluginDataInsert` type.
			 * @returns The inserted plugin data entry as returned by the database.
			 *
			 * @private
			 * @remarks
			 * This function is used internally to insert new plugin data entries.
			 * It returns the inserted entry's `id` as part of the result.
			 */
			const _insertPluginDataEntry = dbService.makeQuery((query, data: tsPluginDataInsert) =>
				query((db) => db.insert(tsPluginData).values(data).returning({ id: tsPluginData.id }).get())
			);

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
			const _updatePluginDataEntry = dbService.makeQuery((query, data: tsPluginDataSelect) =>
				query((db) =>
					db
						.update(tsPluginData)
						.set(data)
						.where(eq(tsPluginData.id, data.id))
						.returning({ id: tsPluginData.id })
						.get()
				)
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
			const _selectPageDataEntryRespondOrFail = Effect.fn(
				'studiocms/sdk/SDKCore/modules/plugins/effect/usePluginData._selectPageDataEntryRespondOrFail'
			)(function* (
				id: string,
				{ mode, shouldFail }: { mode: 'exists' | 'doesNotExist'; shouldFail: boolean }
			) {
				// Check if the plugin data with the given ID exists
				const existing = yield* _selectPageDataEntry(id);

				switch (mode) {
					case 'exists': {
						// If it exists and shouldFail is false, return true
						if (existing && !shouldFail) {
							return existing;
						}

						// If it does not exist and shouldFail is true, fail with an error
						if (!existing && shouldFail) {
							return yield* Effect.fail(new Error(`Plugin data with ID ${id} does not exist.`));
						}
						break;
					}
					case 'doesNotExist': {
						// If it does not exist and shouldFail is true, fail with an error
						if (!existing && shouldFail) {
							return yield* Effect.fail(new Error(`Plugin data with ID ${id} already exists.`));
						}

						// If it exists and shouldFail is false, return true
						if (existing && !shouldFail) {
							return existing;
						}
						break;
					}
					default:
						return yield* Effect.fail(new Error(`Invalid mode: ${mode}`));
				}

				// If we reach here, it means the data does not exist and shouldFail is false
				return yield* Effect.fail(new Error(`Plugin data with ID ${id} does not exist.`));
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
				) => Effect.Effect<PluginDataEntry<T>, UnknownException, never>;
				select: <T extends object>(
					validator?: ValidatorOptions<T>
				) => Effect.Effect<PluginDataEntry<T> | undefined, UnknownException, never>;
				update: <T extends object>(
					data: T,
					validator?: ValidatorOptions<T>
				) => Effect.Effect<PluginDataEntry<T>, UnknownException, never>;
			};

			// Implementation of the usePluginData function
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
							dbService
								.execute((db) =>
									db
										.select()
										.from(tsPluginData)
										.where(like(tsPluginData.id, `${pluginId}-%`))
								)
								.pipe(
									Effect.flatMap((entries) =>
										Effect.forEach(entries, (entry) =>
											Effect.gen(function* () {
												const data = yield* parseData<T>(entry.data, validator);
												return yield* parsedDataResponse<T>(entry.id, data);
											})
										)
									)
								),
					};
				}

				// If entryId is provided, we create a unique ID for the plugin data entry
				// This ID is a combination of the pluginId and entryId to ensure uniqueness
				// This allows us to manage specific entries for a plugin
				// The ID is used to perform CRUD operations on the plugin data entry
				// This is useful for cases where a plugin needs to store multiple entries
				// or manage specific data associated with a plugin instance
				const id = `${pluginId}-${entryId}`;

				return {
					/**
					 * Generates a unique ID for the plugin data entry.
					 *
					 * @returns An Effect that yields the generated ID.
					 */
					generatedId: () => Effect.succeed(id),

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
							yield* _selectPageDataEntryRespondOrFail(id, {
								mode: 'exists',
								shouldFail: true,
							});

							// Validate the data before inserting
							const parsedData = yield* parseData<T>(data, validator);

							// Insert the new plugin data into the database
							// Note: The 'id' field is expected to be unique, so we use
							// it as the primary key in the table definition.
							const inserted = yield* _insertPluginDataEntry({
								// @ts-expect-error - drizzle broke the 'id' type
								id,
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
							const existing = yield* _selectPageDataEntryRespondOrFail(id, {
								mode: 'exists',
								shouldFail: false,
							});

							// If it does not exist, return undefined
							if (!existing) return undefined;

							// Validate and parse the existing data
							const data = yield* parseData<T>(existing.data, validator);

							// Return the parsed data response for the existing entry
							return yield* parsedDataResponse<T>(id, data);
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
							yield* _selectPageDataEntryRespondOrFail(id, {
								mode: 'doesNotExist',
								shouldFail: true,
							});

							// Validate the data before updating
							const parsedData = yield* parseData<T>(data, validator);

							// Update the existing plugin data in the database
							const updated = yield* _updatePluginDataEntry({
								id,
								data: parsedData,
							});

							// Return the parsed data response for the updated record
							return yield* parsedDataResponse<T>(updated.id, data);
						}
					),
				};
			}

			/**
			 * An object containing utility functions related to plugins.
			 *
			 * @property usePluginData - A function to access or manipulate plugin data.
			 */
			const PLUGINS = {
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

			return PLUGINS;
		}),
	}
) {}
