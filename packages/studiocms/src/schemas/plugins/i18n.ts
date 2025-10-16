import { z } from 'astro/zod';

export interface TranslationsJSON {
	[key: string]: string;
}

export interface ComponentsJSON {
	[component: string]: TranslationsJSON;
}

export interface PluginTranslations {
	[language: string]: ComponentsJSON;
}

/**
 * Plugin Translation PluginTranslationCollection
 *
 * @example
 * {
 *   'plugin1': {
 *     en: {
 *       comp1: {
 *         title: 'Comp Title',
 *         'another-key': 'Hello!'
 *       },
 *     },
 *     fr: {
 *       comp1: { ... }
 *     },
 *   },
 *   'plugin2': { ... }
 * }
 */
export interface PluginTranslationCollection {
	[plugin: string]: PluginTranslations;
}

export interface AugmentsJSON {
	augments: TranslationsJSON;
}

/**
 * Plugin Augments Translation Collection
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
export interface PluginAugmentsTranslationCollection {
	[language: string]: AugmentsJSON;
}

export const pluginTranslationsSchema = z.custom<PluginTranslations>();

/**
 * Schema for a collection of plugin translations.
 */
export const pluginTranslationCollectionSchema = z.custom<PluginTranslationCollection>();
