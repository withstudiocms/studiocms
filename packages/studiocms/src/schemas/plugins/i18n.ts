import * as Schema from 'effect/Schema';

/**
 * Plugin Translations Schema
 */
export const TranslationsJSONSchema = Schema.mutable(
	Schema.Record({
		key: Schema.String,
		value: Schema.String,
	})
);

/**
 * Type for the plugin translations JSON object.
 */
export type TranslationsJSON = typeof TranslationsJSONSchema.Type;

/**
 * Schema for the components translations JSON object.
 */
export const ComponentsJSONSchema = Schema.mutable(
	Schema.Record({
		key: Schema.String,
		value: TranslationsJSONSchema,
	})
);

/**
 * Type for the components translations JSON object.
 */
export type ComponentsJSON = typeof ComponentsJSONSchema.Type;

/**
 * Schema for the plugin translations collection.
 */
export const PluginTranslationsSchema = Schema.mutable(
	Schema.Record({
		key: Schema.String,
		value: ComponentsJSONSchema,
	})
);

/**
 * Type for the plugin translations collection.
 */
export type PluginTranslations = typeof PluginTranslationsSchema.Type;

/**
 * Schema for a collection of plugin translations.
 */
export const PluginTranslationCollectionSchema = Schema.mutable(
	Schema.Record({
		key: Schema.String,
		value: PluginTranslationsSchema,
	})
);

/**
 * Type for a collection of plugin translations.
 */
export type PluginTranslationCollection = typeof PluginTranslationCollectionSchema.Type;

/**
 * Schema for the plugin augments translations JSON object.
 */
export const AugmentsJSONSchema = Schema.mutable(
	Schema.Struct({
		augments: TranslationsJSONSchema,
	})
);

/**
 * Type for the plugin augments translations JSON object.
 */
export type AugmentsJSON = typeof AugmentsJSONSchema.Type;

/**
 * Schema for a collection of plugin augments translations.
 *
 * @example
 * {
 *  en: {
 *   augments: {
 *    'augment-key': 'Augment Text',
 *    'another-augment': 'More augment text'
 *   }
 *  },
 *  fr: {
 *   augments: { ... }
 *  }
 * }
 */
export const PluginAugmentsTranslationCollectionSchema = Schema.mutable(
	Schema.Record({
		key: Schema.String,
		value: AugmentsJSONSchema,
	})
);

/**
 * Type for a collection of plugin augments translations.
 *
 * @example
 * {
 *  en: {
 *   augments: {
 *    'augment-key': 'Augment Text',
 *    'another-augment': 'More augment text'
 *   }
 *  },
 *  fr: {
 *   augments: { ... }
 *  }
 * }
 */
export type PluginAugmentsTranslationCollection =
	typeof PluginAugmentsTranslationCollectionSchema.Type;
