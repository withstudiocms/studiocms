import type { AvailableIcons } from 'studiocms:ui/icons';
import type { AstroIntegration, AstroIntegrationLogger } from 'astro';
import { ParseResult } from 'effect';
import * as Schema from 'effect/Schema';
import { SyncFunctionSchema } from 'effectify/schemas';
import type { SanitizeOptions } from 'ultrahtml/transformers/sanitize';
import { availableTranslationFileKeys } from '../virtuals/i18n/v-files.js';

const expectedIconPrefixes = ['heroicons', 'simpleicons', 'lang-flags'];

/**
 * Schema for validating UI icon names against the list of available icons in StudioCMS.
 *
 * This schema checks if the provided input is a string and if it exists in the list of available icons, ensuring that only valid icon names are used in plugin configurations.
 */
export const UIIconListSchema = Schema.declare(
	(input: unknown): input is AvailableIcons => {
		if (typeof input !== 'string') {
			return false;
		}
		// Check if the input starts with one of the expected prefixes
		const [prefix] = input.split(':');
		if (!expectedIconPrefixes.includes(prefix)) {
			return false;
		}
		// If the input is a string and has a valid prefix, we assume it's a valid icon name.
		return true;
	},
	{
		title: 'UIIconListSchema',
		identifier: 'UIIconListSchema',
		description:
			'Schema for validating UI icon names against the list of available icons in StudioCMS.',
	}
);

/**
 * Schema for validating SanitizeOptions objects used in plugin configurations.
 */
export const SanitizeOptionsSchema = Schema.declare(
	(input: unknown): input is SanitizeOptions => {
		if (typeof input !== 'object' || input === null) {
			return false;
		}
		// If the input is an object, we assume it's a valid SanitizeOptions object.
		return true;
	},
	{
		title: 'SanitizeOptionsSchema',
		identifier: 'SanitizeOptionsSchema',
		description: 'Schema for validating SanitizeOptions objects used in plugin configurations.',
	}
);

/**
 * Astro Component Schema for defining the structure of an Astro component used in plugins.
 *
 * This schema uses the SyncFunctionSchema to validate that the provided input is a function that takes any arguments and returns any output, allowing for flexibility in defining Astro components within plugins while ensuring they adhere to the expected function structure.
 */
export const AstroComponentSchema = SyncFunctionSchema(Schema.Any, Schema.Any);

/**
 * Schema for validating Astro integrations used in plugin configurations.
 */
export const AstroIntegrationSchema = Schema.declare(
	(input: unknown): input is AstroIntegration => {
		if (typeof input !== 'object' || input === null) {
			return false;
		}
		if ('name' in input && typeof input.name === 'string') {
			return true;
		}
		return false;
	},
	{
		title: 'AstroIntegrationSchema',
		identifier: 'AstroIntegrationSchema',
		description: 'Schema for validating Astro integrations used in plugin configurations.',
	}
);

/**
 * Schema for validating Astro integration loggers used in plugin configurations.
 */
export const AstroIntegrationLoggerSchema = Schema.declare(
	(input: unknown): input is AstroIntegrationLogger => {
		if (typeof input !== 'object' || input === null) {
			return false;
		}
		if (
			'info' in input &&
			typeof input.info === 'function' &&
			'warn' in input &&
			typeof input.warn === 'function' &&
			'error' in input &&
			typeof input.error === 'function' &&
			'debug' in input &&
			typeof input.debug === 'function'
		) {
			return true;
		}
		return false;
	},
	{
		title: 'AstroIntegrationLoggerSchema',
		identifier: 'AstroIntegrationLoggerSchema',
		description: 'Schema for validating Astro integration loggers used in plugin configurations.',
	}
);

/**
 * Schema for validating translation keys used in plugin configurations.
 *
 * This schema checks if the provided input is a string and if it exists in the list of available translation file keys, ensuring that only valid translation keys are used in plugin configurations.
 */
export const I18nKeySchema = Schema.transformOrFail(Schema.String, Schema.String, {
	strict: true,
	decode: (input, _options, ast) => {
		// Check if the input is a string
		if (typeof input !== 'string') {
			return ParseResult.fail(
				new ParseResult.Type(ast, input, 'Expected a string for I18nKeySchema')
			);
		}

		// Check if the input is one of the available translation file keys
		if (!availableTranslationFileKeys.includes(input)) {
			return ParseResult.fail(
				new ParseResult.Type(
					ast,
					input,
					`Invalid translation key. Expected one of: ${availableTranslationFileKeys.join(', ')}`
				)
			);
		}

		// If the input is valid, return it as a successful parse result
		return ParseResult.succeed(input);
	},
	encode: (output) => ParseResult.succeed(output),
}).annotations({
	title: 'I18nKeySchema',
	identifier: 'I18nKeySchema',
	description:
		'Schema for validating translation keys used in plugin configurations, ensuring that only valid translation keys from the available translation file keys are accepted.',
});

/**
 * A Union schema for validating date and time format options
 */
export const LongShortUndefined = Schema.Union(Schema.Literal('long', 'short'), Schema.Undefined);

/**
 * A Union schema for validating date and time format options
 */
export const LongShortNarrowUndefined = Schema.Union(LongShortUndefined, Schema.Literal('narrow'));

/**
 * A Union schema for validating date and time format options
 */
export const Numeric2Digit = Schema.Literal('numeric', '2-digit');

/**
 * A Union schema for validating date and time format options
 */
export const Numeric2DigitUndefined = Schema.Union(Numeric2Digit, Schema.Undefined);

/**
 * A Union schema for validating date and time format options
 */
export const TZOffsets = Schema.Literal('shortOffset', 'longOffset');

/**
 * A Union schema for validating date and time format options
 */
export const TZGenerics = Schema.Literal('shortGeneric', 'longGeneric');

/**
 * A Union schema for validating date and time format options
 */
export const TZName = Schema.Union(LongShortUndefined, TZOffsets, TZGenerics);

/**
 * A Union schema for validating date and time format options
 */
export const BestFitUndefined = Schema.Union(Schema.Literal('best fit'), Schema.Undefined);

/**
 * A Effect schema for validating date and time format options within StudioCMS.
 *
 * This Schema mirrors the JavaScript Intl.DateTimeFormatOptions type, allowing for validation of date and time formatting options used in the StudioCMS dashboard configuration, ensuring that the provided options adhere to the expected structure and values for date and time formatting.
 */
export class DateTimeFormatOptions extends Schema.Class<DateTimeFormatOptions>(
	'DateTimeFormatOptions'
)(
	{
		localeMatcher: Schema.optional(Schema.Union(BestFitUndefined, Schema.Literal('lookup'))),
		weekday: Schema.optional(LongShortNarrowUndefined),
		era: Schema.optional(LongShortNarrowUndefined),
		year: Schema.optional(Numeric2DigitUndefined),
		month: Schema.optional(Schema.Union(Numeric2Digit, LongShortNarrowUndefined)),
		day: Schema.optional(Numeric2DigitUndefined),
		hour: Schema.optional(Numeric2DigitUndefined),
		minute: Schema.optional(Numeric2DigitUndefined),
		second: Schema.optional(Numeric2DigitUndefined),
		timeZoneName: Schema.optional(TZName),
		formatMatcher: Schema.optional(Schema.Union(BestFitUndefined, Schema.Literal('basic'))),
		hour12: Schema.optional(Schema.Union(Schema.Boolean, Schema.Undefined)),
		timeZone: Schema.optional(Schema.Union(Schema.String, Schema.Undefined)),
	},
	{
		title: 'DateTimeFormatOptions',
		description:
			'JavaScript Intl.DateTimeFormatOptions options for formatting dates and times in the dashboard.',
		identifier: 'DateTimeFormatOptions',
	}
) {}

/**
 * A schema for validating email addresses in StudioCMS.
 *
 * This schema uses a regular expression to check if the input string is in a valid email format, ensuring that any email addresses provided in plugin configurations or other parts of StudioCMS adhere to standard email formatting rules. Designed to replace `z.coerce.string().email({ message: 'Email address is invalid' })` with a more aligned validator using the effect schema system.
 *
 * Example usage:
 * ```ts
 * import { Schema } from 'studiocms/effect';
 * import { ValidEmailSchema } from 'studiocms/schemas';
 *
 * const result = Schema.decode(ValidEmailSchema)('example@example.com');
 * //    ^ result: Effect<string, ParseResult.ParseError, never>
 * ```
 */
export const ValidEmailSchema = Schema.transformOrFail(Schema.String, Schema.String, {
	strict: true,
	decode: (input, _options, ast) => {
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(input)) {
			return ParseResult.fail(
				new ParseResult.Type(
					ast,
					input,
					'Invalid email format, expected a valid email address. (e.g., example@example.com)'
				)
			);
		}
		return ParseResult.succeed(input);
	},
	encode: (output) => ParseResult.succeed(output),
}).annotations({
	title: 'ValidEmailSchema',
	identifier: 'ValidEmailSchema',
	description:
		'A schema for validating email addresses in StudioCMS, ensuring that any provided email addresses adhere to standard email formatting rules.',
	examples: ['example@example.com', 'john@doe.com'],
	documentation:
		'This schema uses a regular expression to validate that the input string is in a valid email format, making it suitable for validating email addresses in plugin configurations or other parts of StudioCMS.',
	jsonSchema: {
		type: 'string',
		format: 'email',
	},
});

/**
 * A type representing the result of validating an email address using the ValidEmailSchema, which can either be a success with the valid email string or a failure with a ParseError.
 */
export type ValidationResultSuccess<T> = {
	success: true;
	data: T;
};

/**
 * A utility type representing the result of a successful validation operation, containing the validated data.
 */
export type ValidationResultFailure = {
	success: false;
	error: ParseResult.ParseError;
};

/**
 * A utility type representing the result of a validation operation, which can either be a success with the validated data or a failure with an error.
 */
export type ValidationResult<T> = ValidationResultSuccess<T> | ValidationResultFailure;

/**
 * Utility function to validate an email address using the ValidEmailSchema.
 *
 * Designed to be a drop-in replacement for zod's safeParse method for email validation, this function checks if the provided email string is valid according to the ValidEmailSchema and returns a ValidationResult indicating success or failure of the validation.
 *
 * @param email - The email address to validate.
 * @returns True if the email is valid according to the ValidEmailSchema, or a string error message if it is invalid.
 */
export const isValidEmail = (email: string): ValidationResult<string> => {
	const result = Schema.decodeEither(ValidEmailSchema)(email);
	if (result._tag === 'Left') {
		return { success: false, error: result.left };
	}
	return { success: true, data: email };
};
