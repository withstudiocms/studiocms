import { eq, like } from 'astro:db';
import type { z } from 'astro/zod';
import type { UnknownException } from 'effect/Cause';
import type { ParseError } from 'effect/ParseResult';
import { Effect, genLogger, pipe, Schema } from '../../effect.js';
import { AstroDB, type LibSQLDatabaseError } from '../effect/db.js';
import { tsPluginData } from '../tables.js';

/**
 * Type representing the structure of plugin data in the database when inserting new data.
 */
export type tsPluginDataInsert = typeof tsPluginData.$inferInsert;

/**
 * Type representing the structure of plugin data in the database when selecting existing data.
 */
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
 * Represents a JSON validator function for a specific type.
 *
 * @template T - The type that the validator function checks for.
 * @property jsonFn - A type guard function that determines if the provided data is of type T.
 */
export interface JSONValidatorFn<T> {
	jsonFn: (data: unknown) => data is T;
}

/**
 * Interface representing a validator for an effect schema.
 *
 * @typeParam T - The type of the value that the schema validates.
 *
 * @property effectSchema - The schema used for validation, which takes a value of type `T` and returns either a `ParseError` or `never`.
 */
export interface EffectSchemaValidator<T> {
	effectSchema: Schema.Schema<T, ParseError, never>;
}

/**
 * Interface representing a validator that uses a Zod schema to validate data of type `T`.
 *
 * @template T - The type of data to be validated.
 * @property zodSchema - The Zod schema instance used for validation.
 */
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
 * Enum representing the possible responses when selecting plugin data,
 * indicating whether the existence of the data should cause a failure or not.
 *
 * @enum {string}
 * @property {string} ExistsNoFail - The plugin data exists and should not cause a failure.
 * @property {string} ExistsShouldFail - The plugin data exists and should cause a failure.
 */
export enum SelectPluginDataRespondOrFail {
	ExistsNoFail = 'existsNoFail',
	ExistsShouldFail = 'existsShouldFail',
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

/**
 * Returns a function that validates a boolean condition and either returns the provided value
 * cast to type `T` if the condition is true, or throws an error if the condition is false.
 *
 * @typeParam T - The expected type of the validated object.
 * @param data - The value to be validated and potentially returned as type `T`.
 * @returns A function that takes a boolean indicating validation success.
 * @throws {Error} If the boolean argument is false, throws an error with the serialized value.
 *
 * @example
 * ```typescript
 * const validateUser = isJsonValid<User>(userData);
 * const user = validateUser(isUserValid); // Returns userData as User if valid, otherwise throws.
 * ```
 */
export const isJsonValid =
	<T extends object>(data: unknown) =>
	(isValid: boolean) => {
		if (isValid) return data as T;
		throw new Error(`Validation failed for data: ${JSON.stringify(data)}`);
	};

/**
 * Returns a validator function based on the provided validator options.
 *
 * This function supports three types of validators:
 * - `jsonFn`: A custom JSON validation function.
 * - `effectSchema`: An Effect schema for validation.
 * - `zodSchema`: A Zod schema for validation.
 *
 * The returned validator function takes unknown data and attempts to validate it
 * according to the specified validator. If validation succeeds, the data is returned
 * as type `T`. If validation fails, an error is thrown or returned as an Effect error.
 *
 * @typeParam T - The expected type of the validated data.
 * @param validator - The validator options, which must include one of: `jsonFn`, `effectSchema`, or `zodSchema`.
 * @returns A function that takes unknown data and returns an Effect that resolves to type `T` if validation succeeds, or fails with an error if validation fails.
 * @throws Error if none of the expected validator options are provided.
 */
export const getValidatorFn = Effect.fn('studiocms/sdk/SDKCore/modules/plugins/effect/getValidatorFn')(
	function* <T extends object>(validator: ValidatorOptions<T>) {
		if ('jsonFn' in validator) {
			// Return the JSON validator function
			return (data: unknown) =>
				Effect.try({
					try: () => pipe(validator.jsonFn(data), isJsonValid<T>(data)),
					catch: (error) => new Error(`JSON validation failed: ${(error as Error).message}`),
				});
		}
		if ('effectSchema' in validator) {
			// Return the Effect schema validator function
			return (data: unknown) =>
				Schema.decodeUnknown(validator.effectSchema)(data).pipe(
					Effect.mapError(
						(error) => new Error(`Schema validation failed: ${(error as ParseError).message}`)
					)
				);
		}
		if ('zodSchema' in validator) {
			// Return the Zod schema validator function
			return (data: unknown) =>
				Effect.try({
					try: () => {
						const result = validator.zodSchema.safeParse(data);
						if (result.success) {
							return result.data as T;
						}
						throw new Error(`Zod validation failed: ${result.error.message}`);
					},
					catch: (error) => new Error(`Zod validation failed: ${(error as Error).message}`),
				});
		}
		// If something else is provided, throw an error
		// This ensures that the validator options are strictly typed and cannot
		// be accidentally misconfigured or used incorrectly.
		return yield* Effect.fail(
			new Error(
				'Invalid validator options provided, expected one of: jsonFn, effectSchema, or zodSchema'
			)
		);
	}
);

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

	// If a validator is provided, get the validation function
	const validatorFn = yield* getValidatorFn<T>(validator);

	// Validate the parsed input using the validator function
	// If validation fails, it will throw an error which will be caught by the Effect framework
	// If validation succeeds, it will return the parsed data as type T
	return yield* validatorFn(parsedInput);
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
			const _selectPluginDataEntry = dbService.makeQuery((query, id: string) =>
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
				) => Effect.Effect<PluginDataEntry<T>, UnknownException, never>;
				select: <T extends object>(
					validator?: ValidatorOptions<T>
				) => Effect.Effect<PluginDataEntry<T> | undefined, UnknownException, never>;
				update: <T extends object>(
					data: T,
					validator?: ValidatorOptions<T>
				) => Effect.Effect<PluginDataEntry<T>, UnknownException, never>;
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
							dbService
								.execute((db) =>
									// Select all entries for the given plugin ID
									// The `like` function is used to match entries that start with the pluginId
									// This allows us to retrieve all entries associated with the plugin
									// The `tsPluginData.id` is expected to be in the format of `pluginId-entryId`
									// where `entryId` is the actual id of the entry with the `pluginId` as a prefix
									db
										.select()
										.from(tsPluginData)
										.where(like(tsPluginData.id, `${pluginId}-%`))
								)
								.pipe(
									// Map the results to PluginDataEntry<T> format
									Effect.flatMap((entries) =>
										Effect.forEach(entries, (entry) =>
											Effect.gen(function* () {
												// Validate and parse each entry's data using the provided validator
												// If no validator is provided, we assume the data is already in the correct format
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
