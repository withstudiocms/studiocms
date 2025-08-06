import { Effect, type ParseResult, pipe, Schema } from '../../effect.js';
import type { PluginDataEntry, ValidatorOptions } from '../types/index.js';

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
	NotExistsShouldFail = 'notExistsShouldFail',
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
): Effect.Effect<PluginDataEntry<T>, never, never> =>
	Effect.succeed({
		id,
		data,
	});

/**
 * Filters out `undefined` and `null` values from an array of entries.
 *
 * @typeParam T - The type of the array elements.
 * @param entries - An array containing elements of type `T` or `undefined`.
 * @returns A new array containing only the defined (non-`undefined`, non-`null`) entries of type `T`.
 */
export function noUndefinedEntries<T>(entries: (T | undefined)[]) {
	return entries.filter((entry) => entry !== undefined && entry !== null) as T[];
}

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
		throw new Error('Validation failed for plugin data');
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
export const getValidatorFn = Effect.fn('studiocms/sdk/effect/pluginUtils/getValidatorFn')(
	function* <T extends object, E extends Schema.Struct.Fields>(validator: ValidatorOptions<T, E>) {
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
						(error) =>
							new Error(`Schema validation failed: ${(error as ParseResult.ParseError).message}`)
					)
				) as Effect.Effect<T, Error, never>;
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
						throw new Error(`Zod validation failed: ${result.error.message}`, {
							cause: result.error.cause,
						});
					},
					catch: (error) => new Error((error as Error).message, { cause: (error as Error).cause }),
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
export const parseData = Effect.fn('studiocms/sdk/effect/pluginUtils/parseData')(function* <
	T extends object, E extends Schema.Struct.Fields
>(rawData: unknown, validator?: ValidatorOptions<T, E>) {
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
	const validatorFn = yield* getValidatorFn<T, E>(validator);

	// Validate the parsed input using the validator function
	// If validation fails, it will throw an error which will be caught by the Effect framework
	// If validation succeeds, it will return the parsed data as type T
	return yield* validatorFn(parsedInput);
});
