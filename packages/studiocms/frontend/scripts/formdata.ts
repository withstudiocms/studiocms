import { ParseResult } from 'effect';
import * as Schema from 'effect/Schema';

/**
 * Convenience function to create a Schema from a property of a Schema. This is useful for creating Schemas for objects that are derived from FormData, where the keys are not known at compile time. It allows us to define the shape of the object we want to create from the FormData, while still being able to validate the individual properties using the original Schema.
 *
 * @param self - The original Schema that contains the property we want to extract.
 * @param key - The key of the property we want to extract from the original Schema.
 * @returns A new Schema that validates the value of the specified property from the original Schema.
 */
const FromKeyProperty = <Self extends Schema.Schema.All, Key extends PropertyKey>(
	self: Self,
	key: Key
) => Schema.propertySignature(self).pipe(Schema.fromKey(key));

/**
 * Similar to FromKeyProperty, but makes the property optional and allows for a default value. This is useful for handling optional fields in the FormData, where the absence of a key should not cause validation to fail, and we want to provide a default value instead.
 *
 * @param self - The original Schema that contains the property we want to extract.
 * @param key - The key of the property we want to extract from the original Schema.
 * @returns A new Schema that validates the value of the specified property from the original Schema, but allows it to be optional and provides a default value if it is not present.
 */
const OptionalFromKeyProperty = <Self extends Schema.Schema.All, Key extends PropertyKey>(
	self: Self,
	key: Key
) => Schema.optional(self).pipe(Schema.fromKey(key));

/**
 * Schema for validating that an input is an instance of FormData. This is used as a base for creating more complex Schemas that transform FormData into other shapes, such as objects with specific properties. It ensures that the input we are working with is indeed a FormData instance before we attempt to extract data from it.
 *
 * @remarks
 * This Schema is used in conjunction with the ObjectFromFormData Schema, which transforms a FormData instance into a Record<string, string> object. By validating that the input is a FormData instance first, we can safely perform the transformation and handle any errors that may arise from invalid input.
 */
export const FormDataSchema = Schema.declare(
	(input: unknown): input is FormData => input instanceof FormData,
	{
		title: 'FormData',
		description: 'Schema for validating FormData instances',
		identifier: 'FormData',
	}
);

/**
 * Schema for transforming a FormData instance into a Record<string, string> object. This is useful for handling form submissions, where we want to convert the FormData into a more usable format for processing. It validates that the input is a FormData instance, and then iterates over its entries to create a plain object with string keys and values.
 *
 * @remarks
 * This Schema is used in the CreatePage and EditPage components to handle form submissions. By transforming the FormData into a Record<string, string>, we can easily access the form values using standard object property access, and we can also perform additional validation on the individual properties using other Schemas.
 */
export const ObjectFromFormData = Schema.transformOrFail(
	FormDataSchema,
	Schema.mutable(
		Schema.Record({
			key: Schema.String,
			value: Schema.String,
		})
	),
	{
		strict: true,
		decode: (input, _options, ast) => {
			if (!(input instanceof FormData)) {
				return ParseResult.fail(
					new ParseResult.Type(ast, input, 'Input is not an instance of FormData')
				);
			}
			const record: Record<string, string> = {};
			for (const [key, value] of input.entries()) {
				if (typeof key !== 'string' || typeof value !== 'string') {
					return ParseResult.fail(
						new ParseResult.Type(ast, input, 'FormData keys and values must be strings')
					);
				}
				record[key] = value;
			}
			return ParseResult.succeed(record);
		},
		encode: (input) => {
			const formData = new FormData();
			for (const key in input) {
				formData.append(key, input[key]);
			}
			return ParseResult.succeed(formData);
		},
	}
);

/**
 * Schema for validating that a string is a valid slug. A slug is a URL-friendly string that typically consists of lowercase letters, numbers, hyphens, and slashes. This Schema ensures that the input string adheres to these rules, which is important for generating clean URLs for pages in the CMS. It checks that the string is lowercase, does not contain spaces or special characters (other than hyphens and slashes), and does not have leading or trailing hyphens or slashes.
 *
 * @remarks
 * This Schema is used for validating the slug field when creating or editing pages. By enforcing a specific format for slugs, we can ensure that the generated URLs are consistent and SEO-friendly. If the input does not match the expected slug format, the Schema will fail with a descriptive error message.
 */
export const SlugSchema = Schema.transformOrFail(Schema.String, Schema.String, {
	strict: true,
	decode: (input, _options, ast) => {
		if (typeof input !== 'string') {
			return ParseResult.fail(new ParseResult.Type(ast, input, 'Input is not a string'));
		}
		const slugRegex = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/;
		if (!slugRegex.test(input)) {
			return ParseResult.fail(
				new ParseResult.Type(
					ast,
					input,
					'Slug must be lowercase and can only contain letters, numbers, hyphens, and slashes (no leading/trailing hyphens or slashes)'
				)
			);
		}
		return ParseResult.succeed(input);
	},
	encode: (input) => ParseResult.succeed(input),
});

/**
 * Schema for validating the parent folder field, which can be either a string or null. This is used for handling the parent folder selection when creating or editing pages. The field can be a string representing the ID of the parent folder, or it can be null if the page does not have a parent folder. This Schema ensures that the input is either a valid string or null, and it also handles the case where the string "null" is passed, treating it as null.
 */
export const ParentFolderSchema = Schema.transformOrFail(
	Schema.Union(Schema.String, Schema.Null),
	Schema.Union(Schema.String, Schema.Null),
	{
		strict: true,
		decode: (input, _options, ast) => {
			if (typeof input === 'string') {
				if (input === 'null') {
					return ParseResult.succeed(null);
				}
				return ParseResult.succeed(input);
			}
			if (input === null) {
				return ParseResult.succeed(null);
			}
			return ParseResult.fail(new ParseResult.Type(ast, input, 'Input must be a string or null'));
		},
		encode: (input) => ParseResult.succeed(input),
	}
);

/**
 * Schema for validating that an input is either a string or an array of strings, and transforming it into an array of strings. This is useful for handling form fields that can accept either a single value or multiple values, such as categories or tags. The Schema checks if the input is a string, and if so, it wraps it in an array. If the input is already an array of strings, it validates that all elements are strings and returns it as is. If the input does not match either of these formats, the Schema fails with an error message.
 *
 * @remarks
 * This Schema is used for the categories and tags fields in the CreatePage and EditPage components. By allowing both a single string and an array of strings, we can provide flexibility in how users input data, while still ensuring that the final output is always an array of strings for consistent processing.
 */
export const StringOrStringArrayToStringArraySchema = Schema.transformOrFail(
	Schema.Union(Schema.String, Schema.Array(Schema.String)),
	Schema.Array(Schema.String),
	{
		strict: true,
		decode: (input, _options, ast) => {
			if (typeof input === 'string') {
				const isStringifiedArray = /^\s*\[\s*(".*?"\s*,\s*)*(".*?"\s*)?\]\s*$/.test(input);
				if (isStringifiedArray) {
					try {
						const parsed = JSON.parse(input);
						if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
							return ParseResult.succeed(parsed);
						}
					} catch {}
				}
				if (Array.isArray(input)) {
					return ParseResult.succeed(input);
				}
				return ParseResult.succeed([input]);
			}
			if (Array.isArray(input) && input.every((item) => typeof item === 'string')) {
				return ParseResult.succeed(input);
			}
			return ParseResult.fail(
				new ParseResult.Type(ast, input, 'Input must be a string or an array of strings')
			);
		},
		encode: (input) => ParseResult.succeed(input),
	}
);

/**
 * Schema for validating and transforming the data from the CreatePage form. This Schema defines the expected structure of the data that is submitted when creating a new page, including fields such as title, slug, description, package, showOnNav, heroImage, parentFolder, draft status, showAuthor, showContributors, categories, tags, and augments. It uses the previously defined Schemas for specific fields like SlugSchema and ParentFolderSchema to ensure that the data adheres to the expected formats.
 */
export const CreatePageDataFromFormDataObjectSchema = Schema.Struct({
	title: FromKeyProperty(Schema.String, 'page-title'),
	slug: FromKeyProperty(SlugSchema, 'page-slug'),
	description: OptionalFromKeyProperty(Schema.String, 'page-description'),
	package: FromKeyProperty(Schema.String, 'page-type'),
	showOnNav: OptionalFromKeyProperty(Schema.BooleanFromString, 'show-in-nav'),
	heroImage: OptionalFromKeyProperty(Schema.String, 'page-hero-image'),
	parentFolder: Schema.optionalWith(ParentFolderSchema, {
		default: () => null,
	}).pipe(Schema.fromKey('parent-folder')),
	draft: Schema.optional(Schema.BooleanFromString),
	showAuthor: OptionalFromKeyProperty(Schema.BooleanFromString, 'show-author'),
	showContributors: OptionalFromKeyProperty(Schema.BooleanFromString, 'show-contributors'),
	categories: Schema.optionalWith(StringOrStringArrayToStringArraySchema, {
		default: () => [],
	}),
	tags: Schema.optionalWith(StringOrStringArrayToStringArraySchema, {
		default: () => [],
	}),
	augments: Schema.optional(Schema.Array(Schema.String)),
});

/**
 * Schema for validating and transforming the data from the EditPage form. This Schema extends the CreatePageDataFromFormDataObjectSchema by adding additional fields that are relevant for editing an existing page, such as the page ID, content, content ID, and plugin fields. It ensures that all the necessary data for editing a page is present and correctly formatted, while still allowing for optional fields and providing default values where appropriate.
 */
export const EditPageDataFromFormDataObjectSchema = Schema.mutable(
	Schema.Struct({
		...CreatePageDataFromFormDataObjectSchema.fields,
		id: FromKeyProperty(Schema.String, 'page-id'),
		content: OptionalFromKeyProperty(Schema.String, 'page-content'),
		contentId: OptionalFromKeyProperty(Schema.String, 'page-content-id'),
		pluginFields: Schema.optionalWith(
			Schema.Record({
				key: Schema.String,
				value: Schema.NullOr(Schema.String),
			}),
			{
				default: () => ({}),
			}
		),
	})
);
