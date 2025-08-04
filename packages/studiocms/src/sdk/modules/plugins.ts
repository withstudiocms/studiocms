import { eq } from 'astro:db';
import type { z } from 'astro/zod';
import type { ParseError } from 'effect/ParseResult';
import { Effect, genLogger, Schema } from '../../effect.js';
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
 * Represents a JSON validator function for a specific type.
 *
 * @template T - The type that the validator function checks for.
 * @property jsonFn - A type guard function that determines if the provided data is of type T.
 *
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
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
 * ```
 *
 */
export type JSONValidatorFn<T> = { jsonFn: (data: unknown) => data is T };

/**
 * Represents a validator for an effect schema.
 *
 * @template T - The type of the value that the schema validates.
 * @property effectSchema - The schema used to validate the effect, parameterized with type `T`.
 *
 * @example
 * ```typescript
 * import { Schema } from 'studiocms/effect';
 * const UserSchema = Schema.Struct({
 *   id: Schema.Number,
 *   name: Schema.String,
 *   email: Schema.String
 * });
 * ```
 */
export type EffectSchemaValidator<T> = { effectSchema: Schema.Schema<T, ParseError, never> };

/**
 * Represents a validator that uses a Zod schema to validate data of type `T`.
 *
 * @template T - The type of data to be validated by the Zod schema.
 * @property zodSchema - The Zod schema instance used for validation.
 *
 * @example
 * ```typescript
 * import { z } from 'astro/zod';
 * const UserZodSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string()
 * });
 * ```
 */
export type ZodValidator<T> = { zodSchema: z.ZodSchema<T> };

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
 * // Example of defining a JSON validator Fn for a User type
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 * const userValidator = {
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
 * const UserEffectSchema = Schema.Struct({
 *   id: Schema.Number,
 *   name: Schema.String,
 *   email: Schema.String
 * });
 * const userEffectValidator = {
 *   effectSchema: UserEffectSchema
 * };
 *
 * // Example of defining a Zod validator for a User type
 * import { z } from 'astro/zod';
 * const UserZodSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string()
 * });
 * const userZodValidator = {
 *   zodSchema: UserZodSchema
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
export const parseData = Effect.fn(function* <T extends object>(
	rawData: unknown,
	validator?: ValidatorOptions<T>
) {
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
			const checkForId = dbService.makeQuery((query, toCheck: string) =>
				query((db) => db.select().from(tsPluginData).where(eq(tsPluginData.id, toCheck)).get())
			);

			/**
			 * Provides a set of effectful operations for managing plugin-specific data entries,
			 * uniquely identified by a combination of `pluginId` and `entryId`.
			 *
			 * This hook returns an object with methods to select, insert, and update plugin data
			 * in a type-safe manner, supporting runtime validation via optional type guard validators.
			 *
			 * @param pluginId - The unique identifier for the plugin.
			 * @param entryId - The unique identifier for the data entry within the plugin.
			 * @returns An object containing the following effectful methods:
			 * - `select<T>(validator?)`: Retrieves and parses plugin data of type `T` for the given IDs, or `undefined` if not found.
			 * - `insert<T>(data, validator?)`: Inserts new plugin data of type `T` if it does not already exist, validating before insertion.
			 * - `update<T>(data, validator?)`: Updates existing plugin data of type `T`, validating before updating.
			 *
			 * @typeParam T - The expected shape of the plugin data for select, insert, and update operations.
			 *
			 * @example
			 * ```typescript
			 * const { select, insert, update } = usePluginData('myPlugin', 'entry123');
			 * const result = yield* select<MyType>(myTypeValidator);
			 * ```
			 */
			const usePluginData = (pluginId: string, entryId: string) => {
				// Generate a unique ID for the plugin data entry
				// This ID is a combination of the pluginId and entryId
				// to ensure uniqueness across different plugins and entries
				const id: `${string}_${string}` = `${pluginId}_${entryId}`;
				
				/**
				 * Returns an Effect that succeeds with the provided `id`.
				 *
				 * @remarks
				 * This function wraps the given `id` in an Effect, allowing it to be used in effectful computations.
				 *
				 * @returns An Effect that yields the specified `id` when executed.
				 */
				const generatedId = () => Effect.succeed(id);

				/**
				 * Inserts new plugin data into the database if an entry with the given ID does not already exist.
				 *
				 * @template T - The type of the data to insert.
				 * @param data - The plugin data to be inserted.
				 * @yields Fails with an error if plugin data with the specified ID already exists.
				 * @returns The parsed data response for the newly inserted entry.
				 */
				const insert = Effect.fn(
					'studiocms/sdk/SDKCore/modules/plugins/effect/usePluginData.insert'
				)(function* <T extends object>(data: T, validator?: ValidatorOptions<T>) {
					// Check if the plugin data with the given ID already exists
					const checkExistingId = yield* checkForId(id);

					// If it exists, fail with an error
					if (checkExistingId) {
						return yield* Effect.fail(new Error(`Plugin data with ID ${id} already exists.`));
					}

					// Validate the data before inserting
					const parsedData = yield* parseData<T>(data, validator);

					// Insert the new plugin data into the database
					// Note: The 'id' field is expected to be unique, so we use
					// it as the primary key in the table definition.
					const insertedEntry = yield* dbService.execute((db) =>
						db
							.insert(tsPluginData)
							.values({
								// @ts-expect-error - drizzle broke the 'id' type
								id,
								data: parsedData,
							})
							.returning({ id: tsPluginData.id })
							.get()
					);

					// Return the parsed data response for the newly inserted entry
					return yield* parsedDataResponse<T>(insertedEntry.id, data);
				});

				/**
				 * Selects and parses data associated with a given `id` using a provided type guard validator.
				 *
				 * This generator function checks for the existence of data by `id`, validates and parses it,
				 * and returns a parsed data response if successful. If no data exists for the given `id`, it returns `undefined`.
				 *
				 * @typeParam T - The expected shape of the parsed data.
				 * @param validator - A type guard function that asserts whether the provided data is of type `T`.
				 * @returns A generator yielding either a parsed data response of type `T` or `undefined` if no data exists.
				 */
				const select = Effect.fn(
					'studiocms/sdk/SDKCore/modules/plugins/effect/usePluginData.select'
				)(function* <T extends object>(validator?: ValidatorOptions<T>) {
					// Check if the plugin data with the given ID exists
					const existing = yield* checkForId(id);

					// If no data exists for the given ID, return undefined
					if (!existing) return undefined;

					const data = yield* parseData<T>(existing.data, validator);

					return yield* parsedDataResponse<T>(id, data);
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
				const update = Effect.fn(
					'studiocms/sdk/SDKCore/modules/plugins/effect/usePluginData.update'
				)(function* <T extends object>(data: T, validator?: ValidatorOptions<T>) {
					// Check if the plugin data with the given ID exists
					const checkExistingId = yield* checkForId(id);

					// If it does not exist, fail with an error
					if (!checkExistingId) {
						return yield* Effect.fail(new Error(`Plugin data with ID ${id} does not exist.`));
					}

					// Validate the data before updating
					const parsedData = yield* parseData<T>(data, validator);

					// Update the database record
					const updatedData = yield* dbService.execute((db) =>
						db
							.update(tsPluginData)
							.set({ data: parsedData })
							.where(eq(tsPluginData.id, id))
							.returning({ id: tsPluginData.id })
							.get()
					);

					// Return the parsed data response for the updated record
					return yield* parsedDataResponse<T>(updatedData.id, data);
				});

				return {
					generatedId,
					insert,
					select,
					update,
				};
			};

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
