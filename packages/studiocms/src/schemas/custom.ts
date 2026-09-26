/**
 * Custom schema definitions for StudioCMS.
 *
 * These schemas are used to define the shape of custom configuration options for StudioCMS.
 *
 * @module customSchemas
 * @description This module contains custom schema definitions for StudioCMS, including boolean and string schemas with default values, as well as a utility function for creating optional schemas with defaults.
 */

import * as Schema from 'effect/Schema';

/**
 * Schema definition for a Boolean value that defaults to true if not provided.
 */
export const BooleanDefaultTrue = Schema.optionalWith(Schema.Boolean, {
	default: () => true,
}).annotations({
	default: true,
	description: 'A boolean value that defaults to true if not provided.',
	documentation:
		'This schema is used to define a boolean configuration option that defaults to true if the user does not provide a value.',
	title: 'Boolean with Default True',
});

/**
 * Schema definition for a Boolean value that defaults to false if not provided.
 */
export const BooleanDefaultFalse = Schema.optionalWith(Schema.Boolean, {
	default: () => false,
}).annotations({
	default: false,
	description: 'A boolean value that defaults to false if not provided.',
	documentation:
		'This schema is used to define a boolean configuration option that defaults to false if the user does not provide a value.',
	title: 'Boolean with Default False',
});

/**
 * Schema definition for a String value that defaults to a provided default value if not provided.
 *
 * @param defaultValue - The default string value to use if the value is not provided.
 * @returns A schema for a string with a default value.
 */
export const StringWithDefault = (defaultValue: string) =>
	Schema.optionalWith(Schema.NonEmptyTrimmedString, {
		default: () => defaultValue,
	}).annotations({
		default: defaultValue,
		description: `A string value that defaults to "${defaultValue}" if not provided.`,
		documentation: `This schema is used to define a string configuration option that defaults to "${defaultValue}" if the user does not provide a value.`,
		title: `String with Default "${defaultValue}"`,
	});

/**
 * Utility function to create an optional schema with a default value.
 *
 * @param schema - The schema to make optional with a default value.
 * @param defaultValue - The default value to use if the value is not provided.
 * @returns A schema that is optional and has a default value.
 */
export const OptionalWithDefaults = <A, I>(schema: Schema.Schema<A, I, never>, defaultValue: I) =>
	Schema.optionalWith(schema, {
		default: () => Schema.decodeSync(schema)(defaultValue),
	}).annotations({
		default: Schema.decodeSync(schema)(defaultValue),
		description: `An optional value that defaults to ${JSON.stringify(defaultValue)} if not provided.`,
		documentation: `This schema is used to define an optional configuration option that defaults to ${JSON.stringify(
			defaultValue
		)} if the user does not provide a value.`,
		title: `Optional with Default ${JSON.stringify(defaultValue)}`,
	});
